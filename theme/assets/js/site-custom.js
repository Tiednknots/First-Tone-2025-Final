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
      const payload = {
        name: formData.get('name-3') || formData.get('name-2') || '',
        surname: formData.get('Surname-2') || '',
        email: formData.get('email-3') || formData.get('email-2') || '',
        company: formData.get('Company-2') || '',
        message: formData.get('Additional-Message-3') || formData.get('field-2') || '',
      };
      
      // Determine form type
      const formName = form.getAttribute('data-name') || form.getAttribute('name') || 'contact';
      payload.form_type = formName.toLowerCase().includes('newsletter') ? 'newsletter' : 'contact';
      
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
