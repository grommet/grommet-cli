import React, { Component } from 'react';

import { Grommet, Heading, Paragraph } from 'grommet';

export default class BasicApp extends Component {
  render() {
    return (
      <Grommet>
        <Heading>Hello World</Heading>
        <Paragraph>Hello from a Grommet page!</Paragraph>
      </Grommet>
    );
  }
}
