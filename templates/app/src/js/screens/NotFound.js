import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import Box from 'grommet/components/Box';
import Headline from 'grommet/components/Headline';
import Heading from 'grommet/components/Heading';
import Paragraph from 'grommet/components/Paragraph';

import { navEnable } from '../actions/nav';
import { pageLoaded } from './utils';

class NotFound extends Component {

  componentDidMount() {
    pageLoaded('Not Found');
    this.props.dispatch(navEnable(false));
  }

  componentWillUnmount() {
    this.props.dispatch(navEnable(true));
  }

  render() {
    return (
      <Box full={true} align='center' justify='center'>
        <Headline strong={true}>404</Headline>
        <Heading>Oops...</Heading>
        <Paragraph size='large' align='center'>
          It seems that you are in the wrong route. Please check your URL and
          try again.
        </Paragraph>
      </Box>
    );
  }
}

NotFound.propTypes = {
  dispatch: PropTypes.func.isRequired
};

export default connect()(NotFound);
