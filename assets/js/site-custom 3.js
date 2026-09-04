// site-custom.js
// Custom JavaScript injected globally to handle form submissions and pageview tracking via Supabase API endpoints.

document.addEventListener('DOMContentLoaded', () => {
  // 1. Form Submission Handler
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    // Remove Netlify attributes to prevent conflicts
    form.removeAttribute('data-netlify');
    form.removeAttribute('data-netlify-honeypot');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      
      // Dynamic extraction helper to capture input values regardless of Webflow attribute variants
      function getFieldValue(patterns, inputType = null) {
        for (const [key, val] of formData.entries()) {
          const lowerKey = key.toLowerCase();
          for (const pattern of patterns) {
            if (lowerKey.includes(pattern.toLowerCase()) && val && val.toString().trim() !== '') {
              return val.toString().trim();
            }
          }
        }
        if (inputType) {
          const inputEl = form.querySelector(`input[type="${inputType}"]`);
          if (inputEl && inputEl.value && inputEl.value.trim() !== '') {
            return inputEl.value.trim();
          }
        }
        for (const pattern of patterns) {
          const inputEl = form.querySelector(`[name*="${pattern}" i], [id*="${pattern}" i]`);
          if (inputEl && inputEl.value && inputEl.value.trim() !== '') {
            return inputEl.value.trim();
          }
        }
        return '';
      }

      const payload = {
        name: getFieldValue(['name-3', 'name-2', 'name', 'first-name', 'firstname', 'full-name']),
        surname: getFieldValue(['surname-2', 'surname', 'last-name', 'lastname']),
        email: getFieldValue(['email-3', 'email-2', 'email', 'e-mail'], 'email'),
        company: getFieldValue(['company-2', 'company', 'organization', 'organisation']),
        message: getFieldValue(['additional-message-3', 'field-2', 'message', 'comment', 'notes', 'description'])
      };
      
      // Determine form type
      const formName = (form.getAttribute('data-name') || form.getAttribute('name') || 'contact').toLowerCase();
      const messageText = payload.message ? payload.message.trim() : '';
      
      if (messageText.length > 0) {
        payload.form_type = 'contact';
      } else if (formName.includes('newsletter')) {
        payload.form_type = 'newsletter';
      } else {
        payload.form_type = 'contact';
      }
      
      // Show "Please wait..." state
      const submitBtn = form.querySelector('[type="submit"]');
      const originalBtnVal = submitBtn ? submitBtn.value : 'Submit';
      if (submitBtn) {
        const waitText = submitBtn.getAttribute('data-wait') || 'Please wait...';
        submitBtn.value = waitText;
        submitBtn.disabled = true;
      }
      
      try {
        const response = await fetch('/api/submit-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          // Display Webflow's success UI block and hide the form
          const parent = form.parentElement;
          const successBlock = parent.querySelector('.w-form-done');
          if (successBlock) {
            successBlock.style.display = 'block';
            form.style.display = 'none';
          }
        } else {
          throw new Error('Submission failed');
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        // Display Webflow's error UI block
        const parent = form.parentElement;
        const errorBlock = parent.querySelector('.w-form-fail');
        if (errorBlock) {
          errorBlock.style.display = 'block';
        }
      } finally {
        if (submitBtn) {
          submitBtn.value = originalBtnVal;
          submitBtn.disabled = false;
        }
      }
    });
  });

  // 2. Simple Pageview Analytics Tracker
  async function trackPageView() {
    // Avoid tracking during local test commands unless desired
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Skipping analytics log on localhost');
      return;
    }
    
    try {
      await fetch('/api/track-pageview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: window.location.pathname,
          referrer: document.referrer
        })
      });
    } catch (err) {
      console.warn('Analytics logging failed:', err);
    }
  }

  trackPageView();
});
