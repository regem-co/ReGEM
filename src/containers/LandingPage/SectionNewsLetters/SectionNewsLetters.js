import React from 'react';
import PropTypes from 'prop-types';
import { Form as FinalForm } from 'react-final-form';
import MailchimpSubscribe from 'react-mailchimp-subscribe';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { pathOr } from 'ramda';

import { injectIntl, intlShape } from '../../../util/reactIntl';
import { Form, Logo } from '../../../components';
import FieldTextInput from '../../../components/FieldTextInput/FieldTextInput';
import * as validators from '../../../util/validators';
import css from './SectionNewsLetters.module.css';
import reworkImage from './image.jpg';
import { FormattedMessage } from 'react-intl';

const MailChimpInput = ({ intl }) => {
  const emailPlaceholder = intl.formatMessage({
    id: 'SectionNewsLetters.emailPlaceholder',
  });
  const emailRequiredMessage = intl.formatMessage({
    id: 'LoginForm.emailRequired',
  });
  const emailRequired = validators.required(emailRequiredMessage);
  const emailInvalidMessage = intl.formatMessage({
    id: 'ConfirmSignupForm.emailInvalid',
  });
  const emailValid = validators.emailFormatValid(emailInvalidMessage);
  const url = `${process.env.REACT_APP_MAILCHIMP_URL}/subscribe/post?u=${process.env.REACT_APP_MAILCHIMP_U}&id=${process.env.REACT_APP_MAILCHIMP_ID}`;

  return (
    <>
      <MailchimpSubscribe
        url={url}
        render={({ subscribe, status, message }) => (
          <>
            {status === 'sending' && (
              <div style={{ color: 'white', textAlign: 'center' }}>Sending...</div>
            )}
            {status === 'error' && (
              <div
                style={{ color: 'red', textAlign: 'center' }}
                dangerouslySetInnerHTML={{ __html: message }}
              />
            )}
            {status === 'success' && (
              <div
                style={{ color: 'white', textAlign: 'center' }}
                dangerouslySetInnerHTML={{ __html: message }}
              />
            )}
            {!status && (
              <FinalForm
                onSubmit={subscribe}
                status={status}
                message={message}
                render={({ handleSubmit, status, message }) => (
                  <Form
                    className={css.form}
                    onSubmit={(e, values) => {
                      e.preventDefault();
                      const email = e.target.email.value;
                      email &&
                        subscribe({
                          EMAIL: email,
                        });
                    }}
                  >
                    <FieldTextInput
                      className={css.field}
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder={emailPlaceholder}
                      validate={validators.composeValidators(emailRequired, emailValid)}
                    />
                    <button className={css.button} type="submit">
                      Subscribe
                    </button>
                  </Form>
                )}
              />
            )}
          </>
        )}
      />
    </>
  );
};

const SectionNewsLetters = ({ intl, newsletter: { title, description, image } }) => (
  <div className={css.root}>
    <img src={reworkImage} className={css.image} />

    <div className={css.textSection}>
      <h2 className={css.mainTitle}>
        <FormattedMessage id="SectionNewsLetters.title" />
      </h2>

      <p className={css.text}>
        <FormattedMessage id="SectionNewsLetters.description" />
      </p>
      <MailChimpInput intl={intl} />
    </div>
    <img src={reworkImage} className={css.imageMobile} />
  </div>
);

SectionNewsLetters.defaultProps = { image: null, intl: null };

const { string, Function } = PropTypes;

SectionNewsLetters.propTypes = {
  image: string,
  intl: intlShape.isRequired,
};

const mapStateToProps = ({ LandingPage: state }) => ({
  newsletter: pathOr({}, ['newsletter'], state),
});

export default compose(
  connect(mapStateToProps),
  injectIntl
)(SectionNewsLetters);
