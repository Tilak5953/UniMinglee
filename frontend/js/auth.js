document.addEventListener('DOMContentLoaded', () => {
  // Shared password toggler logic
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('passwordToggle');
  
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      passwordToggle.textContent = type === 'password' ? '👁️' : '🔒';
    });
  }

  // Check if we are on the login page
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = passwordInput.value;
      const submitBtn = document.getElementById('submitBtn');

      if (!email || !password) {
        Toast.error('Please enter all fields');
        return;
      }

      // Simple email format check
      if (!/\S+@\S+\.\S+/.test(email)) {
        Toast.error('Please enter a valid email address');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing In...';

        const res = await API.post('/auth/login', { email, password });
        
        if (res.success) {
          API.setToken(res.token);
          API.setUser(res.user);
          Toast.success(`Welcome back, ${res.user.name}!`);
          
          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 1000);
        } else {
          Toast.error(res.message || 'Invalid email or password');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      } catch (error) {
        console.error(error);
        Toast.error('An unexpected error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }

  // Check if we are on the signup page
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    let currentStep = 1;
    const totalSteps = 3;
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    const universitySelect = document.getElementById('university');
    const otherUniversityGroup = document.getElementById('otherUniversityGroup');
    const otherUniversityInput = document.getElementById('otherUniversity');

    if (universitySelect && otherUniversityGroup) {
      universitySelect.addEventListener('change', () => {
        if (universitySelect.value === 'Other') {
          otherUniversityGroup.style.display = 'block';
          if (otherUniversityInput) {
            otherUniversityInput.required = true;
            otherUniversityInput.focus();
          }
        } else {
          otherUniversityGroup.style.display = 'none';
          if (otherUniversityInput) {
            otherUniversityInput.required = false;
            otherUniversityInput.value = '';
          }
        }
      });
    }
    
    // Arrays to hold selected interests & skills
    const selectedInterests = [];
    const selectedSkills = [];
    let selectedPersonality = 'introvert'; // Default

    // Handle tag selections (Interests)
    const interestTags = document.querySelectorAll('#interestsContainer .tag-selectable');
    interestTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const val = tag.getAttribute('data-val');
        tag.classList.toggle('selected');
        if (tag.classList.contains('selected')) {
          if (!selectedInterests.includes(val)) {
            selectedInterests.push(val);
          }
        } else {
          const index = selectedInterests.indexOf(val);
          if (index > -1) selectedInterests.splice(index, 1);
        }
      });
    });

    // Handle tag selections (Skills)
    const skillTags = document.querySelectorAll('#skillsContainer .tag-selectable');
    skillTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const val = tag.getAttribute('data-val');
        tag.classList.toggle('selected');
        if (tag.classList.contains('selected')) {
          if (!selectedSkills.includes(val)) {
            selectedSkills.push(val);
          }
        } else {
          const index = selectedSkills.indexOf(val);
          if (index > -1) selectedSkills.splice(index, 1);
        }
      });
    });

    // Personality Card selections
    const personalityCards = document.querySelectorAll('.personality-card');
    personalityCards.forEach(card => {
      card.addEventListener('click', () => {
        personalityCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedPersonality = card.getAttribute('data-type');
      });
    });

    // Password strength check listener
    const strengthContainer = document.getElementById('strengthContainer');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      if (!val) {
        strengthContainer.style.display = 'none';
        return;
      }
      strengthContainer.style.display = 'block';
      
      let strength = 'weak';
      let text = 'Weak password';
      
      const hasNumberOrSpecial = /[\d!@#$%^&*()_+{}[\]:;'"<>,.?/~`-]/.test(val);
      const isLongEnough = val.length >= 6;
      const isStrong = val.length >= 8 && /[A-Z]/.test(val) && hasNumberOrSpecial;

      if (isStrong) {
        strength = 'strong';
        text = 'Strong password (Good!)';
      } else if (isLongEnough && hasNumberOrSpecial) {
        strength = 'medium';
        text = 'Medium password';
      }

      strengthFill.className = 'strength-fill';
      strengthFill.classList.add(strength);
      strengthText.className = 'strength-text';
      strengthText.classList.add(strength);
      strengthText.textContent = text;
    });

    // Step Nav logic
    const updateStepUI = () => {
      // Toggle form content divs
      for (let i = 1; i <= totalSteps; i++) {
        const stepDiv = document.getElementById(`step${i}`);
        if (i === currentStep) {
          stepDiv.classList.add('active');
        } else {
          stepDiv.classList.remove('active');
        }
      }

      // Update indicator nodes
      const nodes = document.querySelectorAll('.indicator-node');
      nodes.forEach(node => {
        const stepNum = parseInt(node.getAttribute('data-step'));
        node.className = 'indicator-node';
        if (stepNum === currentStep) {
          node.classList.add('active');
        } else if (stepNum < currentStep) {
          node.classList.add('completed');
          node.textContent = '✓';
        } else {
          node.textContent = stepNum;
        }
      });

      // Show/Hide buttons
      if (currentStep === 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
      } else if (currentStep === totalSteps) {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
      } else {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
      }
    };

    // Validations per step
    const validateStep = (step) => {
      if (step === 1) {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const pass = passwordInput.value;

        if (!name) {
          Toast.error('Please enter your full name');
          return false;
        }
        if (!email) {
          Toast.error('Please enter your campus email');
          return false;
        }
        // General email validation to prevent backend validation errors
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
          Toast.error('Please enter a valid email address (e.g. name@domain.com)');
          return false;
        }
        // Basic university email validation (.edu or .ac.in etc)
        const campusRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ac\.in|org|in)$/i;
        if (!campusRegex.test(email) && !email.includes('uni')) {
          Toast.warning('We recommend using a valid institutional email domain (.edu or .ac.in)');
        }
        if (pass.length < 6) {
          Toast.error('Password must be at least 6 characters long');
          return false;
        }
        return true;
      }
      
      if (step === 2) {
        const uni = document.getElementById('university').value;
        const branch = document.getElementById('branch').value.trim();
        const year = document.getElementById('year').value;

        if (!uni) {
          Toast.error('Please select your university');
          return false;
        }
        if (uni === 'Other') {
          const otherUni = document.getElementById('otherUniversity').value.trim();
          if (!otherUni) {
            Toast.error('Please specify your university name');
            return false;
          }
        }
        if (!branch) {
          Toast.error('Please enter your academic branch');
          return false;
        }
        if (!year) {
          Toast.error('Please select your current year of study');
          return false;
        }
        return true;
      }

      if (step === 3) {
        if (selectedInterests.length < 3) {
          Toast.error('Please select at least 3 interests');
          return false;
        }
        if (selectedSkills.length < 2) {
          Toast.error('Please select at least 2 skills');
          return false;
        }
        return true;
      }
      
      return true;
    };

    nextBtn.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        currentStep++;
        updateStepUI();
      }
    });

    prevBtn.addEventListener('click', () => {
      currentStep--;
      updateStepUI();
    });

    // Form submit registration
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!validateStep(3)) return;

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = passwordInput.value;
      const universitySelectVal = document.getElementById('university').value;
      const branch = document.getElementById('branch').value.trim();
      const year = document.getElementById('year').value;

      const university = universitySelectVal === 'Other' 
        ? document.getElementById('otherUniversity').value.trim() 
        : universitySelectVal;

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        // 1. Post Basic Register Info
        const regRes = await API.post('/auth/register', { name, email, password, university });
        
        if (regRes.success) {
          // Token is auto intercept-bound to API requests now
          API.setToken(regRes.token);
          
          // 2. Put Complete profile setup
          const profileData = {
            branch,
            year,
            personalityType: selectedPersonality,
            interests: selectedInterests,
            skills: selectedSkills,
            bio: `Hello! I'm a student at ${university} studying ${branch}. Let's chat!`
          };

          const updateRes = await API.put('/users/me', profileData);

          if (updateRes.success) {
            API.setUser(updateRes.user);
            Toast.success('Registration and Profile Setup Completed!');
            setTimeout(() => {
              window.location.href = '/dashboard.html';
            }, 1200);
          } else {
            Toast.error(updateRes.message || 'Profile setup failed. You can update it in dashboard.');
            // Re-route to dashboard anyway since account registration was a success
            setTimeout(() => {
              window.location.href = '/dashboard.html';
            }, 1500);
          }
        } else {
          Toast.error(regRes.message || 'Account registration failed.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Profile';
        }
      } catch (error) {
        console.error(error);
        Toast.error('An error occurred during sign up.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Profile';
      }
    });
  }
});
