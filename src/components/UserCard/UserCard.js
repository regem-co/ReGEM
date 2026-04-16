import React, { Component, useEffect, useState } from 'react';
import { string, func, oneOfType } from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import truncate from 'lodash/truncate';
import classNames from 'classnames';
import { AvatarLarge, NamedLink, InlineTextButton, AvatarMedium } from '../../components';
import { ensureUser, ensureCurrentUser } from '../../util/data';
import { propTypes } from '../../util/types';
import GradeIcon from '@mui/icons-material/Grade';
import css from './UserCard.module.css';
import { getUserReviews } from './utils';

// Approximated collapsed size so that there are ~three lines of text
// in the desktop layout in the author section of the ListingPage.
const BIO_COLLAPSED_LENGTH = 170;

const truncated = s => {
  return truncate(s, {
    length: BIO_COLLAPSED_LENGTH,

    // Allow truncated text end only in specific characters. This will
    // make the truncated text shorter than the length if the original
    // text has to be shortened and the substring ends in a separator.
    //
    // This ensures that the final text doesn't get cut in the middle
    // of a word.
    separator: /\s|,|\.|:|;/,
    omission: '…',
  });
};

class ExpandableBio extends Component {
  constructor(props) {
    super(props);
    this.state = { expand: false };
  }
  render() {
    const { expand } = this.state;
    const { className, bio } = this.props;
    const truncatedBio = truncated(bio);

    const handleShowMoreClick = () => {
      this.setState({ expand: true });
    };
    const showMore = (
      <InlineTextButton rootClassName={css.showMore} onClick={handleShowMoreClick}>
        <FormattedMessage id="UserCard.showFullBioLink" />
      </InlineTextButton>
    );
    return (
      <p className={className}>
        {expand ? bio : truncatedBio}
        {bio !== truncatedBio && !expand ? showMore : null}
      </p>
    );
  }
}

ExpandableBio.defaultProps = { className: null };

ExpandableBio.propTypes = {
  className: string,
  bio: string.isRequired,
};

const UserCard = props => {
  const { rootClassName, className, user, currentUser, onContactUser, editParams } = props;

  const [reviewsCount, setReviewsCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (user?.id?.uuid) {
      getUserReviews(user.id.uuid)
        .then(resp => {
          setReviewsCount(resp.reviewsCount || 0);
          setAvgRating(resp.avgRating || 0);
        })
        .catch(e => console.log(e));
    }
  });

  const userIsCurrentUser = user && user.type === 'currentUser';
  const ensuredUser = userIsCurrentUser ? ensureCurrentUser(user) : ensureUser(user);

  const ensuredCurrentUser = ensureCurrentUser(currentUser);
  const isCurrentUser =
    ensuredUser.id && ensuredCurrentUser.id && ensuredUser.id.uuid === ensuredCurrentUser.id.uuid;
  const { displayName, bio } = ensuredUser.attributes.profile;

  const handleContactUserClick = () => {
    onContactUser(user);
  };

  const hasBio = !!bio;
  const classes = classNames(rootClassName || css.root, className);
  const linkClasses = classNames(css.links, {
    [css.withBioMissingAbove]: !hasBio,
  });

  const separator = isCurrentUser ? null : <span className={css.linkSeparator}>•</span>;

  const contact = (
    <InlineTextButton
      rootClassName={css.contact}
      onClick={handleContactUserClick}
      enforcePagePreloadFor="SignupPage"
    >
      <FormattedMessage id="UserCard.contactUser" />
    </InlineTextButton>
  );

  const editProfileMobile = (
    <span className={css.editProfileMobile}>
      <span className={css.linkSeparator}>•</span>
      <NamedLink name="EditListingPage" params={editParams}>
        <FormattedMessage id="ListingPage.editListingLink2" />
      </NamedLink>
    </span>
  );

  const editProfileDesktop = isCurrentUser ? (
    <NamedLink className={css.editProfileDesktop} name="EditListingPage" params={editParams}>
      <FormattedMessage id="ListingPage.editListingLink2" />
    </NamedLink>
  ) : null;

  const links = ensuredUser.id ? (
    <div className={linkClasses}>
      {/* <NamedLink className={css.link} name="ProfilePage" params={{ id: ensuredUser.id.uuid }}>
        <FormattedMessage id="UserCard.viewProfileLink" />
      </NamedLink>
      {separator} */}
      <p className={css.rating}>
        <GradeIcon className={css.ratingStar} />{' '}
        <strong style={{ marginRight: '5px' }}>{reviewsCount} ratings </strong>
      </p>
      {isCurrentUser ? editProfileMobile : contact}
    </div>
  ) : null;

  return (
    <div className={classes}>
      <div className={css.content}>
        <AvatarMedium className={css.avatar} user={user} />
        <div className={css.info}>
          <div className={css.headingRow}>
            <a href={`/u/${user.id.uuid}`}>
              <h3 className={css.heading} style={{  textDecoration: 'underline', cursor: 'pointer', color: 'var(--marketplaceColor)' }}>
                <FormattedMessage id="UserCard.heading" values={{ name: displayName }} />
              </h3>
            </a>
            {editProfileDesktop}
          </div>
          {/* {hasBio ? <ExpandableBio className={css.desktopBio} bio={bio} /> : null} */}
          {links}
        </div>
      </div>
      {/* {hasBio ? <ExpandableBio className={css.mobileBio} bio={bio} /> : null} */}
    </div>
  );
};

UserCard.defaultProps = {
  rootClassName: null,
  className: null,
  user: null,
  currentUser: null,
};

UserCard.propTypes = {
  rootClassName: string,
  className: string,
  user: oneOfType([propTypes.user, propTypes.currentUser]),
  currentUser: propTypes.currentUser,
  onContactUser: func.isRequired,
};

export default UserCard;
