import React from 'react';
import Heading from 'grommet/components/Heading';
import Paragraph from 'grommet/components/Paragraph';
import Section from 'grommet/components/Section';

export default () => (
  <Section primary={true}>
    <Heading tag='h2'>Page 1</Heading>
    <Paragraph>This is a paragraph in the first page</Paragraph>
  </Section>
);
