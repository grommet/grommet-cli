import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import Menu from 'grommet/components/Menu';
import Anchor from 'grommet/components/Anchor';
import Box from 'grommet/components/Box';
import Heading from 'grommet/components/Heading';
import UserIcon from 'grommet/components/icons/base/User';

import { logout } from '../actions/session';

class SessionMenu extends Component {

  constructor() {
    super();
    this._onLogout = this._onLogout.bind(this);
  }

  _onLogout(event) {
    const { session } = this.props;
    event.preventDefault();
    this.props.dispatch(logout(session));
  }

  render() {
    const { dropAlign, colorIndex, session: { name: userName } } = this.props;
    return (
      <Menu icon={<UserIcon />} dropAlign={dropAlign}
        colorIndex={colorIndex} a11yTitle='Session'>
        <Box pad='medium'>
          <Heading tag='h3' margin='none'>{userName}</Heading>
        </Box>
        <Anchor href='#' onClick={this._onLogout} label='Logout' />
      </Menu>
    );
  }

}

SessionMenu.propTypes = {
  colorIndex: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
  dropAlign: Menu.propTypes.dropAlign,
  session: PropTypes.object.isRequired
};

const select = state => ({
  session: state.session
});

export default connect(select)(SessionMenu);
