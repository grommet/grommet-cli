// (C) Copyright 2014-2015 Hewlett Packard Enterprise Development LP

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import Box from 'grommet/components/Box';
import Button from 'grommet/components/Button';
import Title from 'grommet/components/Title';
import Logo from 'grommet/components/icons/Grommet';

import { navActivate } from '../actions/nav';

class NavControl extends Component {
  render() {
    const { name, nav: { active } } = this.props;

    let result;
    const title = <Title>{name || '<%= appTitle %>'}</Title>;
    if (!active) {
      result = (
        <Button onClick={() => this.props.dispatch(navActivate(true))}>
          <Box direction='row' responsive={false}
            pad={{ between: 'small' }}>
            <Logo />
            {title}
          </Box>
        </Button>
      );
    } else {
      result = title;
    }
    return result;
  }
}

NavControl.propTypes = {
  dispatch: PropTypes.func.isRequired,
  name: PropTypes.string,
  nav: PropTypes.object
};

const select = state => ({
  nav: state.nav
});

export default connect(select)(NavControl);
