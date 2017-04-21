import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import Anchor from 'grommet/components/Anchor';
import Article from 'grommet/components/Article';
import Box from 'grommet/components/Box';
import Header from 'grommet/components/Header';
import Heading from 'grommet/components/Heading';
import Label from 'grommet/components/Label';
import Meter from 'grommet/components/Meter';
import Notification from 'grommet/components/Notification';
import Value from 'grommet/components/Value';
import Spinning from 'grommet/components/icons/Spinning';
import LinkPrevious from 'grommet/components/icons/base/LinkPrevious';

import {
  loadTask, unloadTask
} from '../actions/tasks';

import { pageLoaded } from './utils';

class Task extends Component {

  componentDidMount() {
    const { match: { params }, dispatch } = this.props;
    pageLoaded('Task');
    dispatch(loadTask(params.id));
  }

  componentWillUnmount() {
    const { match: { params }, dispatch } = this.props;
    dispatch(unloadTask(params.id));
  }

  render() {
    const { error, task } = this.props;

    let errorNode;
    let taskNode;
    if (error) {
      errorNode = (
        <Notification status='critical' size='large' state={error.message}
          message='An unexpected error happened, please try again later' />
      );
    } else if (!task) {
      taskNode = (
        <Box direction='row' responsive={false}
          pad={{ between: 'small', horizontal: 'medium', vertical: 'medium' }}>
          <Spinning /><span>Loading...</span>
        </Box>
      );
    } else {
      taskNode = (
        <Box pad='medium'>
          <Label>Status: {task.status}</Label>
          <Box direction='row' responsive={false}
            pad={{ between: 'small' }}>
            <Value value={task.percentComplete}
              units='%'
              align='start' size='small' />
            <Meter value={task.percentComplete} />
          </Box>
        </Box>
      );
    }

    return (
      <Article primary={true} full={true}>
        <Header direction='row' size='large' colorIndex='light-2'
          align='center' responsive={false}
          pad={{ horizontal: 'small' }}>
          <Anchor path='/tasks'>
            <LinkPrevious a11yTitle='Back to Tasks' />
          </Anchor>
          <Heading margin='none' strong={true}>
            {task ? task.name : 'Task'}
          </Heading>
        </Header>
        {errorNode}

        {taskNode}
      </Article>
    );
  }
}

Task.propTypes = {
  dispatch: PropTypes.func.isRequired,
  error: PropTypes.object,
  match: PropTypes.object.isRequired,
  task: PropTypes.object
};

const select = state => ({ ...state.tasks });

export default connect(select)(Task);
