import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { UserCard, Modal } from '../../components';
import EnquiryForm from './EnquiryForm/EnquiryForm';

import css from './ListingPage.module.css';
import { richText } from '../../util/richText';

const SectionAuthorMaybe = props => {
  const {
    title,
    listing,
    authorDisplayName,
    onContactUser,
    isEnquiryModalOpen,
    onCloseEnquiryModal,
    sendEnquiryError,
    sendEnquiryInProgress,
    onSubmitEnquiry,
    currentUser,
    onManageDisableScrolling,
    editParams,
    reviews,
    description,
    category,
  } = props;

  if (!listing.author) {
    return null;
  }

  return (
    <div id="author" className={css.sectionAuthor}>
      <UserCard
        user={listing.author}
        currentUser={currentUser}
        onContactUser={onContactUser}
        editParams={editParams}
        reviews={reviews}
      />
      {/* <div className={css.mobileDescription}>
        <p className={css.category}>{category}</p>
        <h2 className={css.orderTitle}>{title}</h2>
        <p className={css.description}>
          {richText(description, {
            longWordMinLength: 20,
            longWordClass: css.longWord,
          })}
        </p>
      </div> */}
      <Modal
        id="ListingPage.enquiry"
        contentClassName={css.enquiryModalContent}
        isOpen={isEnquiryModalOpen}
        onClose={onCloseEnquiryModal}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <EnquiryForm
          className={css.enquiryForm}
          submitButtonWrapperClassName={css.enquirySubmitButtonWrapper}
          listingTitle={title}
          authorDisplayName={authorDisplayName}
          sendEnquiryError={sendEnquiryError}
          onSubmit={onSubmitEnquiry}
          inProgress={sendEnquiryInProgress}
        />
      </Modal>
    </div>
  );
};

export default SectionAuthorMaybe;
