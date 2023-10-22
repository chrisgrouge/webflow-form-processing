function validateEmail(contactemail) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(contactemail).toLowerCase());
}

$('#footer-email').keyup(function(){
  let isValid = $(this).is(':valid') && validateEmail($(this).val());
  if (isValid) {
    $('#footer-email').addClass("success");
    $('#footer-email').removeClass("error");
    $('#error-footer-email').hide();
  } else {
    $('#footer-email').removeClass("success");
    $('#footer-email').addClass("error");
    $('#error-footer-email').show();
  }
});

const formSubmitHandler = {
  button: null,
  form: null,
  isAcousticForm: false,
  isFormSubmitted: false,
  recaptcha: null,
  acousticFormLoadingState() {
    const isLoading = formSubmitHandler.isFormSubmitted;
    const buttonSubmitArrow = formSubmitHandler.form.find(".contact-submit-arrow-2 svg:first");
    const acousticFormLoadingSpinner = formSubmitHandler.form.find(".AcousticFormLoading");
    
    if (isLoading) {
      buttonSubmitArrow.hide();
      acousticFormLoadingSpinner.css("display", "block");
    }
    else {
      buttonSubmitArrow.show();
      acousticFormLoadingSpinner.css("display", "none");
    }  
  },
  acousticFormValidation: {
    requiredFields: 0,
    validFields: 0,
    _addHiddenPageUrlInput(input, form) {
      input.length
        ? input.val(window.location.href)
        : form.append("<input type='hidden' name='formSubmittedFromUrl' value='" + window.location.href + "'>");
    },
    _handleInvalidInput(field, id, name) {
      field.addClass("error").removeClass("success");
      $("#error-" + id).show();
      console.error(`Invalid input value: ${name}`);
    },
    _handleUncheckedInput(field, name) {
      field.addClass("error").removeClass("success");
      this._handleUncheckedInputError(field, "show");
      console.error(`Invalid checkbox: ${name}`);
    },
    _handleUncheckedInputError(field, visibility) {
      var parentID = field.parent().attr("id");
      var error = $("#error-" + parentID);
      if (visibility == "show") {
        error.show();
        return
      }
      error.hide();
    },
    _handleValidInput(field, id) {
      this.validFields++;
      field.removeClass("error").addClass("success");
      // if field is checkbox or radio, hide error message
      if(field.is("input[type='checkbox']") || field.is("input[type='radio']")) {
        this._handleUncheckedInputError(field, "hide");
        return
      }
      $("#error-" + id).hide();
    },
    _validateField(field) {
      const
        id = $(field).attr("id"),
        name = $(field).attr("name"),
        type = $(field).attr("type"),
        value = $(field).val(),
        isValidEmail = value != "" && validateEmail(value),
        form = formSubmitHandler.form,
        isCheckbox = type == "checkbox",
        isRadio = type == "radio";
        
      let countCheckedCheckboxes = isCheckbox ? form.find("input[name='" + name + "']:checked").length : 0;
      const countCheckedRadios = isRadio ? form.find("input[name='" + name + "']:checked").length : 0;
      
      // adding a work around for the unsubscribe form becuase it technically has two radios with different names but are supposed to act like one fieldset of radios
      if(form.attr("id") == "unsubscribe") {
        const countUnsubRadios = form.find("input[type='radio']:checked").length;
        if(countUnsubRadios > 0) {
          countCheckedCheckboxes++;
        }
      }

      switch (true) {
        case name == "Email" && !isValidEmail:
          this._handleInvalidInput($(field), id, name);
          break;
        case (isCheckbox && countCheckedCheckboxes == 0):
          this._handleUncheckedInput($(field), name);
          break;
        case (isRadio && countCheckedRadios == 0):
          this._handleUncheckedInput($(field), name);
          break;
        case $(field).is("select") && $("#" + id + " option:selected").val() == "":
          this._handleInvalidInput($(field), id, name);
          break;
        case value == "":
          this._handleInvalidInput($(field), id, name);
          break;
        default:
          this._handleValidInput($(field), id);
      }
    },
    validate() {
      // reset properties to 0 for each form submission
      this.requiredFields = 0;
      this.validFields = 0;
      const form = formSubmitHandler.form;

      form.find("input:required, textarea:required, select:required").each((index, field) => {
        this.requiredFields++;
        this._validateField(field);
      });

      console.log("Total required inputs: " + this.requiredFields, "  |  Total valid inputs: " + this.validFields);

      // append a hidden input to the form with the full page url as the value.
      // this is only used for logging purposes.
      this._addHiddenPageUrlInput(form.find("input[name='formSubmittedFromUrl']"), form);
      
      // if all required inputs are valid, submit the form
      if(this.requiredFields === this.validFields) {
        form.submit();
        return
      }

      // default to stop loading animation becuase not all required inputs are valid and the form will not submit
      formSubmitHandler.isFormSubmitted = false;
      formSubmitHandler.acousticFormLoadingState();
    }
  },
  _executeRecaptcha(resolve, reject) {
    try {
      grecaptcha.ready(() => {
        grecaptcha
          .execute('6LdtEAkeAAAAAOioARNXsjsYyY2E4hCK9B0GrUCj', {action: 'submit'})
          .then((token) => {
            if (formSubmitHandler.recaptcha.length) {
              formSubmitHandler.recaptcha.val(token);
            } else {
              formSubmitHandler.form.append('<input type="hidden" name="g-recaptcha-response" value="' + token + '">');
            }
            resolve();
          })
          .catch((error) => {
            console.error('Error: grecaptcha failed to execute. ' + error);
            reject(error);
          });
      });
    } catch (error) {
      console.error('Error: grecaptcha is not ready. ' + error);
      reject(error);
    }
  },
  submit(event) {
    event.preventDefault();
    if (this.isFormSubmitted) {
      return;
    }
    this.isFormSubmitted = true;
    this.button = event.target
    this.form = $(this.button).closest('form');
    this.isAcousticForm = this.form.hasClass('AcousticForm');
    this.recaptcha = this.form.find("[name='g-recaptcha-response']");
    
    // start loading animation
    this.isAcousticForm && this.acousticFormLoadingState();

    // execute recaptcha and submit form if successful
    new Promise((resolve, reject) => {
      this._executeRecaptcha(resolve, reject);
    }).then(() => {
      this.acousticFormValidation.validate();
    }).catch((error) => {
      // stop loading animation
      this.isFormSubmitted = false;
      this.isAcousticForm && acousticFormLoadingState();
      console.error('Error: Promise rejected. ' + error);
    });
  }
}

// just for testing locally
// $(".recaptcha-send-btn").click(formSubmitHandler.submit.bind(formSubmitHandler));

// $("#unsubscribe").on("submit", formSubmitHandler.acousticFormValidation.validate.bind(formSubmitHandler));