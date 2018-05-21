import React from 'react';
import PropTypes from 'prop-types';
import { ACTION_TYPES } from './reducer';

let uniqueId = 0;
function getUniqueId() {
  uniqueId += 1;
  return uniqueId;
}

async function maybeFetchData(
  { args, didArgsChange, dispatch, fn, id, preventFetch },
  ctx = {}
) {
  const shouldFetchData = !preventFetch && didArgsChange;
  if (!shouldFetchData) {
    return;
  }

  dispatch({
    args,
    id,
    type: ACTION_TYPES.LOADING
  });
  const fetchId = getUniqueId();
  ctx.fetchId = fetchId;
  try {
    const data = await fn(...args);
    if (fetchId === ctx.fetchId) {
      dispatch({
        args,
        data,
        id,
        type: ACTION_TYPES.SUCCESS
      });
    }
  } catch (error) {
    if (fetchId === ctx.fetchId) {
      console.error(error);
      dispatch({
        args,
        error,
        id,
        type: ACTION_TYPES.FAILURE
      });
    }
  }
}

export class ReactReduxRequestView extends React.Component {
  componentDidMount() {
    maybeFetchData(this.props, this);
  }

  componentDidUpdate() {
    maybeFetchData(this.props, this);
  }

  componentWillUnmount() {
    const { dispatch, id } = this.props;
    dispatch({
      id,
      type: ACTION_TYPES.UNMOUNT
    });
    this.fetchId = null;
  }

  render() {
    const { render, selectorResult } = this.props;

    try {
      return render(selectorResult);
    } catch (e) {
      console.error(
        `The render method of "Request#${this.props.id}" threw an error:\n`,
        e
      );
      return null;
    }
  }
}

ReactReduxRequestView.propTypes = {
  args: PropTypes.array,
  didArgsChange: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
  fn: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  preventFetch: PropTypes.bool.isRequired,
  render: PropTypes.func,
  selectorResult: PropTypes.any
};

ReactReduxRequestView.defaultProps = {
  args: [],
  preventFetch: false,
  render: () => null,
  selectorResult: {}
};
