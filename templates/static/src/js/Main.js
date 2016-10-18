import React, { Component } from 'react';

import Anchor from 'grommet/components/Anchor';
import App from 'grommet/components/App';
import Box from 'grommet/components/Box';
import Header from 'grommet/components/Header';
import Title from 'grommet/components/Title';

import { browserHistory } from 'react-router';

export default class Main extends Component {
  render () {
    return (
      <App centered={false}>
        <Header direction="row" justify="between" pad={{horizontal: 'medium'}}>
          <Title><Anchor href="/" onClick={(event) => {
            event.preventDefault();
            browserHistory.push('/');
          }} label='<%= appTitle %>' /></Title>
          <Anchor href="/page1" onClick={(event) => {
            event.preventDefault();
            browserHistory.push('/page1');
          }} label='Page 1' />
        </Header>
        <Box pad={{horizontal: 'medium'}}>
          {this.props.children}
        </Box>
      </App>
    );
  }
};
