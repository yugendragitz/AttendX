"""
AttendX Scraper - KL University ERP Attendance Scraper
======================================================
This module handles the automated login and attendance scraping from KL University ERP.

SECURITY NOTE:
- Credentials are NEVER stored
- They are only used temporarily to authenticate
- The browser session is immediately closed after scraping
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import re
import base64
import uuid
import os
from typing import Dict, List, Optional

# Try to import webdriver_manager for automatic ChromeDriver management
try:
    from webdriver_manager.chrome import ChromeDriverManager
    WEBDRIVER_MANAGER_AVAILABLE = True
except ImportError:
    WEBDRIVER_MANAGER_AVAILABLE = False
    print("webdriver_manager not installed. Using system ChromeDriver.")

# Store active browser sessions for CAPTCHA flow
# Key: session_id, Value: {"driver": driver, "username": str, "password": str, "created": timestamp}
ACTIVE_SESSIONS: Dict[str, Dict] = {}


# KL University ERP Configuration
PORTAL_LOGIN_URL = "https://newerp.kluniversity.in/index.php"
PORTAL_ATTENDANCE_URL = "https://newerp.kluniversity.in/index.php?r=studentattendance%2Fstudentdailyattendance%2Fsearchgetinput"

# KL University ERP Selectors
SELECTORS = {
    # Login page selectors
    "username_input": "input[name='LoginForm[username]'], input#loginform-username, input[name='username']",
    "password_input": "input[name='LoginForm[password]'], input#loginform-password, input[type='password']",
    "login_button": "button[type='submit'], input[type='submit'], .btn-primary",
    
    # After login - student name
    "student_name": ".user-name, .profile-name, .student-name, span.username",
    
    # Attendance page elements
    "attendance_table": "table.table, table.kv-grid-table, .grid-view table, table",
    "attendance_row": "tbody tr",
    "subject_name": "td:nth-child(2), td.subject",  # Usually subject is in 2nd column
    "attendance_value": "td:nth-child(5), td:nth-child(6), td.percentage",  # Attendance % column
}


class AttendanceScraper:
    """
    Selenium-based attendance scraper for student portals.
    
    Usage:
        scraper = AttendanceScraper()
        result = scraper.fetch_attendance(username, password)
    """
    
    def __init__(self, headless: bool = True):
        """
        Initialize the scraper.
        
        Args:
            headless: Run browser in headless mode (no GUI)
        """
        self.headless = headless
        self.driver = None
        self.wait = None
        # Speed optimization: shorter timeouts
        self.fast_wait = None
    
    def _setup_driver(self):
        """Configure and initialize the Chrome WebDriver with speed optimizations."""
        options = Options()
        
        if self.headless:
            options.add_argument("--headless=new")
        
        # Speed optimizations (but keep images enabled for CAPTCHA!)
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-infobars")
        options.add_argument("--disable-logging")
        options.add_argument("--disable-default-apps")
        options.add_argument("--disable-popup-blocking")
        options.add_argument("--disable-translate")
        options.add_argument("--disable-background-networking")
        options.add_argument("--disable-sync")
        options.add_argument("--no-first-run")
        options.add_argument("--no-default-browser-check")
        options.add_argument("--window-size=1920,1080")
        
        # Disable notifications only (keep images for CAPTCHA!)
        prefs = {
            "profile.default_content_setting_values.notifications": 2,
        }
        options.add_experimental_option("prefs", prefs)
        
        # Page load strategy - eager is faster but still loads images
        options.page_load_strategy = 'eager'
        
        # User agent to avoid detection
        options.add_argument(
            "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        
        # Allow platform-specific browser configuration (e.g., Render container).
        chrome_bin = os.getenv("CHROME_BIN", "").strip()
        chromedriver_path = os.getenv("CHROMEDRIVER_PATH", "").strip()
        disable_wdm = os.getenv("DISABLE_WEBDRIVER_MANAGER", "false").lower() == "true"

        if chrome_bin:
            options.binary_location = chrome_bin

        # Initialize driver
        if chromedriver_path:
            service = Service(chromedriver_path)
            self.driver = webdriver.Chrome(service=service, options=options)
        elif WEBDRIVER_MANAGER_AVAILABLE and not disable_wdm:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)
        else:
            self.driver = webdriver.Chrome(options=options)
        
        # Shorter implicit wait for speed
        self.driver.implicitly_wait(3)
        self.wait = WebDriverWait(self.driver, 8)
        self.fast_wait = WebDriverWait(self.driver, 3)
    
    def _cleanup(self):
        """Close the browser and cleanup resources."""
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            self.driver = None
    
    def _find_element_multi_selector(self, selectors: str):
        """
        Try multiple CSS selectors and return the first matching element.
        
        Args:
            selectors: Comma-separated CSS selectors
            
        Returns:
            WebElement or None
        """
        for selector in selectors.split(", "):
            try:
                element = self.driver.find_element(By.CSS_SELECTOR, selector.strip())
                if element:
                    return element
            except NoSuchElementException:
                continue
        return None
    
    # ============= TWO-STEP CAPTCHA FLOW =============
    
    def init_login(self, username: str, password: str) -> Dict:
        """
        Step 1: Initialize login - open page, fill credentials, return CAPTCHA image.
        OPTIMIZED for speed.
        """
        try:
            self._setup_driver()
            
            # Navigate to login page
            self.driver.get(PORTAL_LOGIN_URL)
            
            # Wait for page to load (use explicit wait instead of sleep)
            try:
                self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "form")))
            except:
                time.sleep(1)
            
            # Fill username
            username_input = self._find_element_multi_selector(SELECTORS["username_input"])
            if username_input:
                username_input.clear()
                username_input.send_keys(username)
            else:
                self._cleanup()
                return {"success": False, "message": "Could not find username field"}
            
            # Fill password
            password_input = self._find_element_multi_selector(SELECTORS["password_input"])
            if password_input:
                password_input.clear()
                password_input.send_keys(password)
            else:
                self._cleanup()
                return {"success": False, "message": "Could not find password field"}
            
            # Find and capture CAPTCHA image
            captcha_image_b64 = None
            captcha_selectors = [
                "img[src*='captcha']",
                "img[src*='Captcha']",
                "img.captcha",
                "#captcha-image",
                ".captcha-img",
                "img[alt*='captcha']",
                "img[alt*='verification']",
                # KL ERP specific - usually the CAPTCHA is near the verification input
                "img"
            ]
            
            for selector in captcha_selectors:
                try:
                    if selector == "img":
                        # For generic img, look for ones near verification input
                        images = self.driver.find_elements(By.TAG_NAME, "img")
                        for img in images:
                            src = img.get_attribute("src") or ""
                            if "captcha" in src.lower() or "verification" in src.lower():
                                # Get image as base64
                                captcha_image_b64 = img.screenshot_as_base64
                                print(f"Found CAPTCHA image via src")
                                break
                    else:
                        captcha_img = self.driver.find_element(By.CSS_SELECTOR, selector)
                        if captcha_img:
                            captcha_image_b64 = captcha_img.screenshot_as_base64
                            print(f"Found CAPTCHA with selector: {selector}")
                            break
                except:
                    continue
            
            # If no CAPTCHA found by selectors, try to find by position (near verification input)
            if not captcha_image_b64:
                try:
                    # Find all images and look for one that looks like CAPTCHA
                    images = self.driver.find_elements(By.TAG_NAME, "img")
                    for img in images:
                        width = img.size.get('width', 0)
                        height = img.size.get('height', 0)
                        # CAPTCHA images are typically small-medium sized
                        if 50 < width < 300 and 20 < height < 100:
                            src = img.get_attribute("src") or ""
                            # Skip logos and icons
                            if "logo" not in src.lower() and "icon" not in src.lower():
                                captcha_image_b64 = img.screenshot_as_base64
                                print(f"Found CAPTCHA by size: {width}x{height}")
                                break
                except Exception as e:
                    print(f"Error finding CAPTCHA by size: {e}")
            
            if not captcha_image_b64:
                self._cleanup()
                return {"success": False, "message": "Could not find CAPTCHA image"}
            
            # Generate session ID and store the browser session
            session_id = str(uuid.uuid4())
            ACTIVE_SESSIONS[session_id] = {
                "driver": self.driver,
                "wait": self.wait,
                "username": username,
                "created": time.time()
            }
            
            # Don't cleanup - keep browser open for step 2
            self.driver = None
            self.wait = None
            
            return {
                "success": True,
                "session_id": session_id,
                "captcha_image": captcha_image_b64
            }
            
        except Exception as e:
            self._cleanup()
            return {"success": False, "message": f"Error: {str(e)}"}
    
    def complete_login(self, session_id: str, captcha_code: str) -> Dict:
        """
        Step 2: Complete login with CAPTCHA code and scrape attendance.
        
        Args:
            session_id: Session ID from init_login
            captcha_code: CAPTCHA code entered by user
            
        Returns:
            Dict with attendance data
        """
        if session_id not in ACTIVE_SESSIONS:
            return {"success": False, "message": "Session expired. Please try again."}
        
        session = ACTIVE_SESSIONS.pop(session_id)
        self.driver = session["driver"]
        self.wait = session["wait"]
        username = session["username"]
        
        try:
            # Find and fill CAPTCHA input
            captcha_input_selectors = [
                "input[name*='captcha']",
                "input[name*='Captcha']",
                "input[name*='verification']",
                "input[name*='Verification']",
                "input[placeholder*='captcha']",
                "input[placeholder*='verification']",
                "#captcha",
                ".captcha-input",
                "input[name='LoginForm[verifyCode]']"
            ]
            
            captcha_input = None
            for selector in captcha_input_selectors:
                try:
                    captcha_input = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if captcha_input:
                        print(f"Found CAPTCHA input with: {selector}")
                        break
                except:
                    continue
            
            # If not found, try finding input near CAPTCHA label
            if not captcha_input:
                try:
                    inputs = self.driver.find_elements(By.TAG_NAME, "input")
                    for inp in inputs:
                        inp_type = inp.get_attribute("type") or ""
                        inp_name = inp.get_attribute("name") or ""
                        placeholder = inp.get_attribute("placeholder") or ""
                        if inp_type == "text" and ("verif" in inp_name.lower() or "verif" in placeholder.lower() or "code" in placeholder.lower()):
                            captcha_input = inp
                            print("Found CAPTCHA input by scanning inputs")
                            break
                except:
                    pass
            
            if not captcha_input:
                self._cleanup()
                return {"success": False, "message": "Could not find CAPTCHA input field"}
            
            captcha_input.clear()
            captcha_input.send_keys(captcha_code)
            
            # Click login button
            login_button = self._find_element_multi_selector(SELECTORS["login_button"])
            if login_button:
                login_button.click()
            else:
                self._cleanup()
                return {"success": False, "message": "Could not find login button"}
            
            # Wait for URL change (faster than fixed sleep)
            try:
                self.wait.until(lambda d: "login" not in d.current_url.lower() or d.find_elements(By.CSS_SELECTOR, ".alert-danger, .help-block-error"))
            except:
                time.sleep(1.5)
            
            # Check for login success
            current_url = self.driver.current_url.lower()
            
            # Check for error message (wrong CAPTCHA or credentials)
            try:
                error_elems = self.driver.find_elements(By.CSS_SELECTOR, ".alert-danger, .help-block-error, .error-message")
                for error in error_elems:
                    error_text = error.text.lower()
                    if "verification" in error_text or "incorrect" in error_text or "invalid" in error_text:
                        self._cleanup()
                        return {"success": False, "message": "Invalid CAPTCHA or credentials. Please try again."}
            except:
                pass
            
            # Check if still on login page
            if "login" in current_url:
                self._cleanup()
                return {"success": False, "message": "Login failed. Please check credentials."}
            
            print("Login successful! Fetching attendance...")
            
            # Get student name (quick)
            student_name = self._get_student_name_fast()
            if student_name == "Student":
                student_name = username
            
            # Navigate to attendance and scrape (OPTIMIZED)
            subjects = self._navigate_and_scrape_fast()
            
            print(f"Found {len(subjects)} subjects")
            
            # Also fetch timetable
            print("Fetching timetable...")
            timetable_result = self._scrape_timetable()
            timetable = timetable_result.get("timetable", {}) if timetable_result.get("success") else {}
            
            self._cleanup()
            
            if not subjects:
                return {
                    "success": True,
                    "student_name": student_name,
                    "subjects": [],
                    "timetable": timetable,
                    "message": "Login successful but no attendance data found."
                }
            
            return {
                "success": True,
                "student_name": student_name,
                "subjects": subjects,
                "timetable": timetable
            }
            
        except Exception as e:
            self._cleanup()
            return {"success": False, "message": f"Error: {str(e)}"}
    
    # ============= END TWO-STEP CAPTCHA FLOW =============
    
    def _login(self, username: str, password: str) -> bool:
        """
        Perform login to KL University ERP portal.
        
        Args:
            username: Student Roll Number (e.g., 2100030001)
            password: Password
            
        Returns:
            True if login successful, False otherwise
        """
        try:
            # Navigate to login page
            self.driver.get(PORTAL_LOGIN_URL)
            time.sleep(3)  # Wait for page load
            
            # Find and fill username (roll number)
            username_input = self._find_element_multi_selector(SELECTORS["username_input"])
            if username_input:
                username_input.clear()
                username_input.send_keys(username)
            else:
                print("Could not find username input field")
                return False
            
            # Find and fill password
            password_input = self._find_element_multi_selector(SELECTORS["password_input"])
            if password_input:
                password_input.clear()
                password_input.send_keys(password)
            else:
                print("Could not find password input field")
                return False
            
            # DON'T click login - CAPTCHA required!
            # User must manually enter CAPTCHA and click Login
            print("="*60)
            print("CAPTCHA REQUIRED!")
            print("Please enter the CAPTCHA in the Chrome window and click Login")
            print("Waiting for you to complete login...")
            print("="*60)
            
            # Wait for user to enter CAPTCHA and login manually (max 60 seconds)
            max_wait = 60
            start_time = time.time()
            
            while time.time() - start_time < max_wait:
                time.sleep(2)
                current_url = self.driver.current_url.lower()
                
                # Check if we've moved past the login page
                if "site/login" not in current_url and "index.php" in current_url:
                    # Check if we're on a dashboard/home page (not login)
                    try:
                        # Look for elements that indicate successful login
                        self.driver.find_element(By.CSS_SELECTOR, ".sidebar, .navbar, .user-menu, .dropdown-toggle")
                        print("Login successful!")
                        return True
                    except:
                        pass
                
                # Also check for error message (wrong CAPTCHA)
                try:
                    error = self.driver.find_element(By.CSS_SELECTOR, ".alert-danger, .help-block-error")
                    if error and "verification" in error.text.lower():
                        print("Wrong CAPTCHA - please try again")
                except:
                    pass
            
            print("Login timeout - took too long")
            return False
            
        except TimeoutException:
            print("Login timeout")
            return False
        except Exception as e:
            print(f"Login error: {str(e)}")
            return False
    
    def _get_student_name(self) -> str:
        """Extract student name from KL University ERP."""
        try:
            # Try multiple selectors for student name
            selectors = [
                ".user-menu .username",
                ".navbar-right .dropdown-toggle",
                ".user-info",
                "span.username",
                ".profile-name",
                "#user-name"
            ]
            for selector in selectors:
                try:
                    element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if element and element.text.strip():
                        return element.text.strip()
                except:
                    continue
        except Exception:
            pass
        return "Student"
    
    def _get_student_name_fast(self) -> str:
        """Extract student name quickly - limited attempts."""
        try:
            elem = self.driver.find_element(By.CSS_SELECTOR, ".user-menu .username, span.username, .navbar-right .dropdown-toggle")
            if elem and elem.text.strip():
                return elem.text.strip()
        except:
            pass
        return "Student"
    
    def _navigate_and_scrape_fast(self) -> List[Dict]:
        """
        OPTIMIZED: Navigate to attendance and scrape in one fast flow.
        Reduces waits and skips unnecessary debug operations.
        """
        from selenium.webdriver.support.ui import Select
        subjects = []
        
        try:
            # Navigate to attendance page
            self.driver.get(PORTAL_ATTENDANCE_URL)
            
            # Wait for page to have dropdowns
            try:
                self.fast_wait.until(EC.presence_of_element_located((By.TAG_NAME, "select")))
            except:
                time.sleep(1)
            
            # Find all select dropdowns
            all_selects = self.driver.find_elements(By.TAG_NAME, "select")
            
            # Quick select Year (first dropdown)
            if len(all_selects) >= 1:
                try:
                    year_select = Select(all_selects[0])
                    for option in year_select.options:
                        text = option.text.strip()
                        if "2025" in text or "2024" in text:
                            year_select.select_by_visible_text(text)
                            break
                except:
                    pass
            
            # Quick wait for semester dropdown to update
            time.sleep(0.5)
            
            # Quick select Semester (second dropdown)
            all_selects = self.driver.find_elements(By.TAG_NAME, "select")
            if len(all_selects) >= 2:
                try:
                    sem_select = Select(all_selects[1])
                    for target in ["Even", "Odd", "II", "I", "2", "1"]:
                        for option in sem_select.options:
                            if target in option.text:
                                sem_select.select_by_visible_text(option.text.strip())
                                break
                        else:
                            continue
                        break
                except:
                    if len(sem_select.options) > 1:
                        sem_select.select_by_index(1)
            
            # Click Search button immediately
            time.sleep(0.3)
            search_clicked = False
            for selector in ["button.btn-primary", "input[type='submit']", "button[type='submit']", ".btn-success"]:
                try:
                    btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                    btn.click()
                    search_clicked = True
                    break
                except:
                    continue
            
            if not search_clicked:
                try:
                    btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Search')]")
                    btn.click()
                except:
                    pass
            
            # Wait for table to appear (not fixed sleep)
            try:
                self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "table tbody tr")))
            except:
                time.sleep(2)
            
            # Scrape the table
            subjects = self._scrape_attendance_fast()
            
        except Exception as e:
            print(f"Navigate error: {e}")
        
        return subjects
    
    def _scrape_attendance_fast(self) -> List[Dict]:
        """OPTIMIZED: Scrape attendance table quickly."""
        subjects = []
        
        try:
            # Find the main table
            tables = self.driver.find_elements(By.CSS_SELECTOR, "table")
            
            for table in tables:
                rows = table.find_elements(By.CSS_SELECTOR, "tbody tr")
                if len(rows) == 0:
                    continue
                
                for row in rows:
                    try:
                        cells = row.find_elements(By.TAG_NAME, "td")
                        num_cells = len(cells)
                        
                        if num_cells < 3:
                            continue
                        
                        # Get subject name (column 3, index 2)
                        subject_name = cells[2].text.strip() if num_cells > 2 else ""
                        if not subject_name:
                            subject_name = cells[1].text.strip() if num_cells > 1 else ""
                        
                        if not subject_name:
                            continue
                        
                        # Skip header rows
                        if subject_name.lower() in ['subject', 'course', 'coursedesc', 'name', 's.no', '#', 'coursecode', 'ltps']:
                            continue
                        
                        # Get LTPS (column 4, index 3)
                        ltps = ""
                        if num_cells > 3:
                            ltps_raw = cells[3].text.strip()
                            if '-' in ltps_raw:
                                ltps = ltps_raw
                        
                        # Get attendance data
                        total_conducted = 0
                        total_attended = 0
                        tcbr = 0
                        attendance_value = None
                        
                        # Try to get from expected columns (8, 9, 11, 12)
                        if num_cells >= 10:
                            try:
                                c_text = cells[8].text.strip() if num_cells > 8 else ""
                                a_text = cells[9].text.strip() if num_cells > 9 else ""
                                t_text = cells[11].text.strip() if num_cells > 11 else ""
                                
                                if c_text.isdigit():
                                    total_conducted = int(c_text)
                                if a_text.isdigit():
                                    total_attended = int(a_text)
                                if t_text.isdigit():
                                    tcbr = int(t_text)
                            except:
                                pass
                        
                        # Find percentage (scan from right)
                        for i in range(num_cells - 1, max(0, num_cells - 5), -1):
                            text = cells[i].text.strip()
                            if not text or len(text) > 10:
                                continue
                            parsed = self._parse_attendance(text)
                            if parsed is not None and 0 <= parsed <= 100:
                                attendance_value = parsed
                                break
                        
                        if attendance_value is not None and subject_name:
                            if not any(s['name'] == subject_name for s in subjects):
                                subject_data = {
                                    "name": subject_name,
                                    "attendance": attendance_value,
                                    "ltps": ltps,
                                    "tcbr": tcbr
                                }
                                if total_conducted > 0:
                                    subject_data["totalClasses"] = total_conducted
                                    subject_data["attendedClasses"] = total_attended
                                subjects.append(subject_data)
                    except:
                        continue
                
                if subjects:
                    break
                    
        except Exception as e:
            print(f"Scrape error: {e}")
        
        return subjects
    
    def _navigate_to_attendance(self) -> bool:
        """Navigate to attendance page and select current semester."""
        try:
            from selenium.webdriver.support.ui import Select
            
            self.driver.get(PORTAL_ATTENDANCE_URL)
            time.sleep(4)
            
            print("="*60)
            print("Navigated to attendance page")
            print(f"Current URL: {self.driver.current_url}")
            
            # Save screenshot for debugging
            try:
                self.driver.save_screenshot("debug_attendance_page.png")
                print("Saved screenshot: debug_attendance_page.png")
            except Exception as e:
                print(f"Could not save screenshot: {e}")
            
            # Find all select dropdowns on the page
            all_selects = self.driver.find_elements(By.TAG_NAME, "select")
            print(f"Found {len(all_selects)} select dropdowns")
            
            # Print all select IDs and names for debugging
            for idx, sel in enumerate(all_selects):
                sel_id = sel.get_attribute("id")
                sel_name = sel.get_attribute("name")
                print(f"  Select {idx}: id='{sel_id}', name='{sel_name}'")
            
            # Select Academic Year dropdown (first select usually)
            year_selected = False
            for sel in all_selects:
                sel_name = sel.get_attribute("name") or ""
                sel_id = sel.get_attribute("id") or ""
                if "academicyear" in sel_name.lower() or "academicyear" in sel_id.lower() or "year" in sel_name.lower():
                    try:
                        year_select = Select(sel)
                        print(f"Year dropdown has {len(year_select.options)} options")
                        for option in year_select.options:
                            text = option.text.strip()
                            print(f"    Year option: '{text}'")
                        # Select 2025-2026 or 2024-2025
                        for target_year in ["2025-2026", "2024-2025", "2024"]:
                            for option in year_select.options:
                                text = option.text.strip()
                                if target_year in text:
                                    year_select.select_by_visible_text(text)
                                    print(f">>> Selected year: {text}")
                                    year_selected = True
                                    break
                            if year_selected:
                                break
                        time.sleep(2)
                    except Exception as e:
                        print(f"Error with year dropdown: {e}")
                    break
            
            if not year_selected and len(all_selects) >= 1:
                try:
                    year_select = Select(all_selects[0])
                    print(f"Trying first dropdown with {len(year_select.options)} options")
                    for option in year_select.options:
                        text = option.text.strip()
                        if "2025" in text or "2024" in text:
                            year_select.select_by_visible_text(text)
                            print(f">>> Selected: {text}")
                            break
                    time.sleep(2)
                except Exception as e:
                    print(f"Error: {e}")
            
            # Select Semester dropdown (second select usually)
            sem_selected = False
            for sel in all_selects:
                sel_name = sel.get_attribute("name") or ""
                sel_id = sel.get_attribute("id") or ""
                if "semester" in sel_name.lower() or "semester" in sel_id.lower() or "sem" in sel_name.lower():
                    try:
                        sem_select = Select(sel)
                        print(f"Semester dropdown has {len(sem_select.options)} options")
                        for option in sem_select.options:
                            text = option.text.strip()
                            print(f"    Semester option: '{text}'")
                        # Select Even semester or first available
                        for target_sem in ["Even", "Odd", "II", "I", "2", "1"]:
                            for option in sem_select.options:
                                text = option.text.strip()
                                if target_sem in text:
                                    sem_select.select_by_visible_text(text)
                                    print(f">>> Selected semester: {text}")
                                    sem_selected = True
                                    break
                            if sem_selected:
                                break
                        time.sleep(2)
                    except Exception as e:
                        print(f"Error with semester dropdown: {e}")
                    break
            
            if not sem_selected and len(all_selects) >= 2:
                try:
                    sem_select = Select(all_selects[1])
                    print(f"Trying second dropdown with {len(sem_select.options)} options")
                    if len(sem_select.options) > 1:
                        sem_select.select_by_index(1)
                        print(f">>> Selected index 1: {sem_select.first_selected_option.text}")
                    time.sleep(2)
                except Exception as e:
                    print(f"Error: {e}")
            
            # Click Search button - try multiple approaches
            search_clicked = False
            search_selectors = [
                "button.btn-primary",
                "input[type='submit']",
                "button[type='submit']",
                ".btn-success",
                "#search-btn",
                "button.btn"
            ]
            
            for selector in search_selectors:
                try:
                    search_btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                    btn_text = search_btn.text or search_btn.get_attribute("value") or ""
                    print(f"Found button: '{btn_text}' with selector '{selector}'")
                    search_btn.click()
                    print(f">>> Clicked Search button")
                    search_clicked = True
                    break
                except:
                    continue
            
            if not search_clicked:
                try:
                    search_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Search')]")
                    search_btn.click()
                    print(">>> Clicked Search button (by text)")
                    search_clicked = True
                except:
                    pass
                    
            if not search_clicked:
                # Try clicking any button
                buttons = self.driver.find_elements(By.TAG_NAME, "button")
                print(f"Found {len(buttons)} buttons total")
                for btn in buttons:
                    btn_text = btn.text.strip()
                    btn_class = btn.get_attribute("class") or ""
                    print(f"  Button: '{btn_text}' class='{btn_class}'")
                    if "search" in btn_text.lower() or "submit" in btn_text.lower():
                        btn.click()
                        print(f">>> Clicked: {btn_text}")
                        search_clicked = True
                        break
            
            # Wait for table to load
            time.sleep(5)
            print("Waiting for table to load...")
            
            # Save screenshot after clicking search
            try:
                self.driver.save_screenshot("debug_after_search.png")
                print("Saved screenshot: debug_after_search.png")
            except:
                pass
            
            # Save page HTML for debugging
            try:
                html = self.driver.page_source
                with open("debug_page.html", "w", encoding="utf-8") as f:
                    f.write(html)
                print("Saved HTML: debug_page.html")
            except:
                pass
            
            # Check if table appeared
            try:
                table = self.driver.find_element(By.CSS_SELECTOR, "#printTable table, .kv-grid-table, table.table")
                print(">>> Table found!")
            except:
                print("No table found after search")
            
            print("="*60)
            return True
            
        except Exception as e:
            print(f"Could not navigate to attendance: {str(e)}")
            import traceback
            traceback.print_exc()
        return False
    
    def _scrape_attendance(self) -> List[Dict]:
        """
        Scrape attendance data from KL University ERP table.
        
        Returns:
            List of dictionaries with subject attendance data
        """
        subjects = []
        
        try:
            # Wait for table to load
            time.sleep(2)
            
            print("Searching for attendance table...")
            
            # Look for the printTable div first (specific to KL ERP)
            try:
                print_div = self.driver.find_element(By.CSS_SELECTOR, "#printTable")
                print("Found #printTable div")
            except:
                print("No #printTable div found")
            
            # Find all tables
            tables = self.driver.find_elements(By.CSS_SELECTOR, "table")
            print(f"Found {len(tables)} tables on page")
            
            for table_idx, table in enumerate(tables):
                rows = table.find_elements(By.CSS_SELECTOR, "tbody tr")
                print(f"Table {table_idx}: Found {len(rows)} rows")
                
                if len(rows) == 0:
                    continue
                
                for row_idx, row in enumerate(rows):
                    try:
                        cells = row.find_elements(By.TAG_NAME, "td")
                        num_cells = len(cells)
                        
                        if num_cells < 3:
                            continue
                        
                        # Debug: Print first few rows completely
                        if row_idx < 2:
                            cell_texts = [c.text.strip()[:25] for c in cells]
                            print(f"  Row {row_idx} ({num_cells} cells): {cell_texts}")
                        
                        # Get subject name from column 3 (Coursedesc) - index 2
                        subject_name = cells[2].text.strip() if num_cells > 2 else ""
                        
                        # If no subject name, try column 2 (Coursecode) - index 1
                        if not subject_name and num_cells > 1:
                            subject_name = cells[1].text.strip()
                        
                        if not subject_name:
                            continue
                        
                        # Skip headers
                        skip_words = ['subject', 'course', 'coursedesc', 'name', 's.no', 'sl.no', '#', 'coursecode', 'ltps', 'section']
                        if subject_name.lower() in skip_words:
                            continue
                        
                        # KL ERP Table Structure - columns vary, need to detect dynamically
                        # Common: # | Coursecode | Coursedesc | Ltps | ... | Total Conducted | Total Attended | Total Absent | Tcbr | Percentage
                        
                        # Debug: Print all cell values for first few rows to see structure
                        if row_idx < 2:
                            print(f"  === Row {row_idx} has {num_cells} cells ===")
                            for ci, c in enumerate(cells):
                                print(f"    [{ci}]: '{c.text.strip()[:40]}'")
                        
                        # Get LTPS - look for pattern like "3-0-0-0"
                        ltps = ""
                        for ci in range(min(6, num_cells)):
                            cell_text = cells[ci].text.strip()
                            if cell_text and '-' in cell_text:
                                parts = cell_text.split('-')
                                if len(parts) == 4 and all(p.isdigit() for p in parts if p):
                                    ltps = cell_text
                                    if row_idx < 2:
                                        print(f"    Found LTPS: {ltps} at column {ci}")
                                    break
                        
                        # Initialize counters
                        total_conducted = 0
                        total_attended = 0
                        total_absent = 0
                        tcbr = 0
                        
                        # Scan all cells to find numeric values
                        # Pattern: we're looking for consecutive numbers that represent conducted/attended/absent/tcbr
                        numeric_cells = []
                        for ci in range(num_cells):
                            cell_text = cells[ci].text.strip()
                            if cell_text.isdigit():
                                numeric_cells.append((ci, int(cell_text)))
                        
                        if row_idx < 2:
                            print(f"    Numeric cells: {numeric_cells}")
                        
                        # Usually the pattern is: ... | Conducted | Attended | Absent | TCBR | Percentage
                        # Find groups of consecutive numeric columns
                        if len(numeric_cells) >= 4:
                            # Last numeric before percentage is usually TCBR
                            # Look for conducted (larger number), attended, absent, tcbr pattern
                            for i in range(len(numeric_cells) - 3):
                                col1, val1 = numeric_cells[i]
                                col2, val2 = numeric_cells[i + 1]
                                col3, val3 = numeric_cells[i + 2]
                                col4, val4 = numeric_cells[i + 3]
                                
                                # Check if columns are consecutive or near consecutive
                                if col4 - col1 <= 6:
                                    # val1 should be conducted (>= attended + absent)
                                    # val2 should be attended
                                    # val3 should be absent (= conducted - attended)
                                    # val4 could be TCBR
                                    if val1 >= val2 and val2 + val3 == val1:
                                        total_conducted = val1
                                        total_attended = val2
                                        total_absent = val3
                                        tcbr = val4
                                        if row_idx < 2:
                                            print(f"    Pattern match: conducted={val1}, attended={val2}, absent={val3}, tcbr={val4}")
                                        break
                                    elif val1 >= val2:
                                        # Might be: conducted, attended, absent, tcbr without sum check
                                        total_conducted = val1
                                        total_attended = val2
                                        total_absent = val3
                                        tcbr = val4
                                        if row_idx < 2:
                                            print(f"    Possible match: conducted={val1}, attended={val2}, absent={val3}, tcbr={val4}")
                        
                        # Fallback: try specific column indices if we have enough columns
                        if total_conducted == 0 and num_cells >= 10:
                            try:
                                # Try different column layouts
                                for offset in [7, 8, 9]:
                                    if offset + 4 <= num_cells:
                                        c_text = cells[offset].text.strip()
                                        a_text = cells[offset + 1].text.strip()
                                        ab_text = cells[offset + 2].text.strip()
                                        t_text = cells[offset + 3].text.strip()
                                        
                                        if c_text.isdigit() and a_text.isdigit():
                                            total_conducted = int(c_text)
                                            total_attended = int(a_text)
                                            if ab_text.isdigit():
                                                total_absent = int(ab_text)
                                            if t_text.isdigit():
                                                tcbr = int(t_text)
                                            if row_idx < 2:
                                                print(f"    Fallback at offset {offset}: c={total_conducted}, a={total_attended}, tcbr={tcbr}")
                                            break
                            except Exception as e:
                                print(f"    Error in fallback: {e}")
                        
                        # Look for percentage - scan all cells for a number that looks like percentage
                        attendance_value = None
                        
                        # Scan from right to left looking for percentage
                        for i in range(num_cells - 1, -1, -1):
                            text = cells[i].text.strip()
                            
                            # Skip empty cells
                            if not text:
                                continue
                            
                            # Skip cells that are clearly not percentages
                            if len(text) > 15:
                                continue
                            if text in ['N', 'Y', 'L', 'T', 'P', 'S']:  # Single letters
                                continue
                                
                            parsed = self._parse_attendance(text)
                            if parsed is not None and 0 <= parsed <= 100:
                                attendance_value = parsed
                                if row_idx < 2:
                                    print(f"    Found attendance {attendance_value}% in column {i}")
                                break
                        
                        if attendance_value is not None and subject_name:
                            # Don't add duplicates
                            if not any(s['name'] == subject_name for s in subjects):
                                subject_data = {
                                    "name": subject_name,
                                    "attendance": attendance_value,
                                    "ltps": ltps,
                                    "tcbr": tcbr
                                }
                                # Add class counts if we have them
                                if total_conducted > 0:
                                    subject_data["totalClasses"] = total_conducted
                                    subject_data["attendedClasses"] = total_attended
                                
                                subjects.append(subject_data)
                                print(f"Added: {subject_name} = {attendance_value}% LTPS={ltps} TCBR={tcbr} ({total_attended}/{total_conducted})")
                            
                    except Exception as e:
                        print(f"Error parsing row: {str(e)}")
                        continue
                
                # If we found subjects, don't check other tables
                if subjects:
                    break
                        
        except Exception as e:
            print(f"Error scraping attendance: {str(e)}")
        
        return subjects
    
    def _parse_attendance(self, text: str) -> Optional[int]:
        """
        Parse attendance percentage from text.
        
        Args:
            text: Text containing attendance value (e.g., "85%", "85.5", "85")
            
        Returns:
            Integer attendance value or None
        """
        try:
            # Remove % sign and whitespace
            cleaned = text.replace('%', '').strip()
            
            # Try to find a number in the text
            match = re.search(r'(\d+(?:\.\d+)?)', cleaned)
            if match:
                return round(float(match.group(1)))
            
        except Exception:
            pass
        
        return None
    
    # ============= TIMETABLE SCRAPING =============
    
    def _scrape_timetable(self) -> Dict:
        """
        Scrape timetable from KL University ERP.
        
        Returns:
            Dict with timetable data organized by day
        """
        from selenium.webdriver.support.ui import Select
        
        # KL ERP Timetable URL (Individual Student Timetable View)
        TIMETABLE_URL = "https://newerp.kluniversity.in/index.php?r=timetables%2Funiversitymasteracademictimetableview%2Findexstudenttimetable"
        
        try:
            print("Navigating to timetable page...")
            self.driver.get(TIMETABLE_URL)
            
            # Wait for page to load
            try:
                self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "select")))
            except:
                time.sleep(2)
            
            # Find all select dropdowns
            all_selects = self.driver.find_elements(By.TAG_NAME, "select")
            print(f"Found {len(all_selects)} dropdowns on timetable page")
            
            # Select Academic Year (first dropdown)
            if len(all_selects) >= 1:
                try:
                    year_select = Select(all_selects[0])
                    for option in year_select.options:
                        text = option.text.strip()
                        if "2025-2026" in text:
                            year_select.select_by_visible_text(text)
                            print(f"Selected year: {text}")
                            break
                except Exception as e:
                    print(f"Year selection error: {e}")
            
            time.sleep(1)
            
            # Re-fetch dropdowns after year selection
            all_selects = self.driver.find_elements(By.TAG_NAME, "select")
            
            # Select Semester (second dropdown)
            if len(all_selects) >= 2:
                try:
                    sem_select = Select(all_selects[1])
                    for target in ["Even Sem", "Even"]:
                        for option in sem_select.options:
                            if target in option.text:
                                sem_select.select_by_visible_text(option.text.strip())
                                print(f"Selected semester: {option.text.strip()}")
                                break
                        else:
                            continue
                        break
                except Exception as e:
                    print(f"Semester selection error: {e}")
            
            time.sleep(0.5)
            
            # Click Search button
            search_clicked = False
            for selector in ["button.btn-primary", "input[type='submit']", "button[type='submit']", ".btn-success", "button:contains('Search')"]:
                try:
                    btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                    btn.click()
                    search_clicked = True
                    print("Clicked search button")
                    break
                except:
                    continue
            
            if not search_clicked:
                try:
                    btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Search')]")
                    btn.click()
                    print("Clicked search button (xpath)")
                except:
                    print("Could not find search button")
            
            # Wait for timetable table to appear
            try:
                self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "table tbody tr")))
            except:
                time.sleep(3)
            
            # Parse timetable table
            timetable = self._parse_erp_timetable()
            
            if any(any(slot for slot in day_slots) for day_slots in timetable.values()):
                print("Timetable scraped successfully!")
                return {
                    "success": True,
                    "timetable": timetable,
                    "year": "2025-2026",
                    "semester": "Even"
                }
            else:
                print("No timetable data found in table")
                return {"success": False, "message": "No timetable data found"}
            
        except Exception as e:
            print(f"Timetable scraping error: {e}")
            return {"success": False, "message": str(e)}
    
    def _parse_erp_timetable(self) -> Dict:
        """
        Parse the ERP timetable table.
        Format: Oday | 1 | 2 | 3 | 4 | 5 | 6 | 7 | ... | 20
        Each cell: CourseCode - Type - Section - RoomNo-Room
        
        Returns:
            Dict with days as keys and list of 7 periods as values
        """
        days_map = {
            'mon': 'Mon', 'monday': 'Mon',
            'tue': 'Tue', 'tuesday': 'Tue',
            'wed': 'Wed', 'wednesday': 'Wed',
            'thu': 'Thu', 'thursday': 'Thu',
            'fri': 'Fri', 'friday': 'Fri',
            'sat': 'Sat', 'saturday': 'Sat'
        }
        
        timetable = {
            'Mon': [None] * 7,
            'Tue': [None] * 7,
            'Wed': [None] * 7,
            'Thu': [None] * 7,
            'Fri': [None] * 7,
            'Sat': [None] * 7,
        }
        
        # Map ERP periods (1-20) to our 7 periods
        # ERP periods 1-7 typically map to our 7 class slots
        period_mapping = {1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6}
        
        try:
            tables = self.driver.find_elements(By.CSS_SELECTOR, "table")
            print(f"Found {len(tables)} tables on page")
            
            for table in tables:
                rows = table.find_elements(By.CSS_SELECTOR, "tbody tr")
                if len(rows) == 0:
                    continue
                
                print(f"Found table with {len(rows)} rows")
                
                for row in rows:
                    cells = row.find_elements(By.TAG_NAME, "td")
                    if len(cells) < 2:
                        continue
                    
                    # First cell is day name
                    day_cell = cells[0].text.strip().lower()
                    
                    # Find matching day
                    day_key = None
                    for key, val in days_map.items():
                        if key in day_cell:
                            day_key = val
                            break
                    
                    if not day_key:
                        continue
                    
                    print(f"Processing {day_key}: {len(cells)} cells")
                    
                    # Parse each period cell (columns 1-7 for our purposes)
                    for col_idx, cell in enumerate(cells[1:8], start=1):  # periods 1-7
                        cell_text = cell.text.strip()
                        if not cell_text or cell_text == '-':
                            continue
                        
                        # Map to our period index (0-6)
                        period_idx = col_idx - 1
                        if period_idx >= 7:
                            continue
                        
                        # Parse cell content
                        class_info = self._parse_erp_cell(cell_text)
                        if class_info:
                            timetable[day_key][period_idx] = class_info
                            print(f"  Period {col_idx}: {class_info['code']} ({class_info['type']})")
                
                # If we found data, stop looking at other tables
                if any(any(slot for slot in day_slots) for day_slots in timetable.values()):
                    break
                    
        except Exception as e:
            print(f"Timetable parse error: {e}")
        
        return timetable
    
    def _parse_erp_cell(self, cell_text: str) -> Optional[Dict]:
        """
        Parse a timetable cell from ERP.
        Format: "24CS2202 - P - S-5 - RoomNo-H101" or multiline
        
        Returns:
            Dict with code, name, type, room, section
        """
        if not cell_text or cell_text == '-':
            return None
        
        try:
            # Handle multiline text (replace newlines with delimiter)
            text = cell_text.replace('\n', ' - ').replace('  ', ' ')
            
            # Split by delimiter
            parts = [p.strip() for p in text.split(' - ') if p.strip()]
            
            if len(parts) < 2:
                # Try splitting by newline directly
                parts = [p.strip() for p in cell_text.split('\n') if p.strip()]
            
            if len(parts) < 2:
                return None
            
            # Course code is first part
            code = parts[0].strip()
            
            # Find type (L/T/P/S) - single letter
            class_type = "L"  # default
            for part in parts:
                part_clean = part.strip().upper()
                if part_clean in ['L', 'T', 'P', 'S']:
                    class_type = part_clean
                    break
            
            # Find section (S-X pattern)
            section = ""
            for part in parts:
                if 'S-' in part or part.startswith('S'):
                    section = part.strip()
                    break
            
            # Find room (RoomNo or H- pattern)
            room = ""
            for part in parts:
                if 'RoomNo' in part or 'H-' in part or 'H1' in part or 'H2' in part or 'H3' in part:
                    room = part.replace('RoomNo-', '').replace('RoomNo', '').strip()
                    break
            
            # Get course name from mapping
            name = self._get_course_name(code)
            
            return {
                "code": code,
                "name": name,
                "type": class_type,
                "room": room,
                "section": section
            }
            
        except Exception as e:
            print(f"Cell parse error for '{cell_text}': {e}")
            return None
    
    def _get_course_name(self, code: str) -> str:
        """Map course code to short name."""
        # Common course code mappings for KL University
        course_names = {
            # User's actual subjects (Even Sem 2025-2026) - from ERP screenshot
            "24MT2012": "Math Opt",
            "24SDCS02": "Full Stack",
            "24CS3207": "Quantum",
            "24CS3206": "TOC",
            "24CC3208": "Azure AI",
            "23UC0014": "GLBC",
            "24CS2204": "CIS",
            "24CS2255F": "ADS",
            "24CS2202": "CN",
            "24CS2203": "DAA",
            "24SDCS01": "FED",
            "24MT2019": "P&S",
            
            # From ERP timetable screenshot
            "24CS2203L": "DAA",
            "24SDCS02L": "Full Stack",
            "24SDDC02": "Skilling",
            
            # Other common subjects
            "24EC2209": "EMWT",
            "24EC2211": "VLSI",
            "24EC221F": "ESD",
            "24EC2208": "DigiCom",
            "24SDEC02": "Skilling",
            "24ACS203M": "ML",
            "24AD2001": "AI ML",
            "24AD2103": "DBMS",
            "24CC3010": "AWS",
            "24SC2006A": "OOP",
            "24CS2101": "OS",
        }
        
        # Try exact match
        if code in course_names:
            return course_names[code]
        
        # Try prefix match (first 8 characters)
        for c, name in course_names.items():
            if code[:8] == c[:8]:
                return name
        
        # Return shortened code as fallback
        return code[:8] if len(code) > 8 else code
    
    def fetch_attendance(self, username: str, password: str) -> Dict:
        """
        Main method to fetch attendance data from KL University ERP.
        
        Args:
            username: Student Roll Number (e.g., 2100030001)
            password: Password
            
        Returns:
            Dictionary with success status, student name, and subjects
        """
        try:
            # Setup browser
            self._setup_driver()
            
            print(f"Attempting login for: {username}")
            
            # Attempt login
            if not self._login(username, password):
                self._cleanup()
                return {
                    "success": False,
                    "message": "Invalid roll number or password"
                }
            
            print("Login successful!")
            
            # Get student name
            student_name = self._get_student_name()
            if student_name == "Student":
                student_name = username  # Use roll number if name not found
            
            print(f"Student: {student_name}")
            
            # Navigate to attendance page
            self._navigate_to_attendance()
            
            # Scrape attendance data
            subjects = self._scrape_attendance()
            
            print(f"Found {len(subjects)} subjects")
            
            # If no subjects found, return error (don't show demo data for real login)
            if not subjects:
                self._cleanup()
                return {
                    "success": True,
                    "student_name": student_name,
                    "subjects": [],
                    "message": "Login successful but no attendance data found. The attendance page structure may have changed."
                }
            
            self._cleanup()
            
            return {
                "success": True,
                "student_name": student_name,
                "subjects": subjects
            }
            
        except Exception as e:
            self._cleanup()
            return {
                "success": False,
                "message": f"Error: {str(e)}"
            }


# Test the scraper directly
if __name__ == "__main__":
    print("Testing AttendX Scraper...")
    print("=" * 50)
    
    # Demo test with fake credentials
    scraper = AttendanceScraper(headless=True)
    result = scraper.fetch_attendance("test_user", "test_pass")
    
    print(f"Success: {result['success']}")
    
    if result['success']:
        print(f"Student: {result['student_name']}")
        print("\nSubjects:")
        for subject in result['subjects']:
            print(f"  - {subject['name']}: {subject['attendance']}%")
    else:
        print(f"Error: {result.get('message', 'Unknown error')}")
