const axios = require('axios');
const url = 'localhost:8080';
const onGlobalSuccess = response => {
  return response.data;
};

const onGlobalError = error => {
  return Promise.reject(error);
};

const pressLeft = () => {
  const config = {
    method: 'GET',
    url: url + '/api/controller/left',
    crossdomain: 'true',
    headers: { 'Content-Type': 'application/json' }
  };
  return axios(config)
    .then(onGlobalSuccess)
    .catch(onGlobalError);
};

const pressRight = () => {
  const config = {
    method: 'GET',
    url: url + '/api/controller/right',
    crossdomain: 'true',
    headers: { 'Content-Type': 'application/json' }
  };
  return axios(config)
    .then(onGlobalSuccess)
    .catch(onGlobalError);
};

const pressUp = () => {
  const config = {
    method: 'GET',
    url: url + '/api/controller/up',
    crossdomain: 'true',
    headers: { 'Content-Type': 'application/json' }
  };
  return axios(config)
    .then(onGlobalSuccess)
    .catch(onGlobalError);
};

const pressDown = () => {
  const config = {
    method: 'GET',
    url: url + '/api/controller/down',
    crossdomain: 'true',
    headers: { 'Content-Type': 'application/json' }
  };
  return axios(config)
    .then(onGlobalSuccess)
    .catch(onGlobalError);
};

const pressB = () => {
  const config = {
    method: 'GET',
    url: url + '/api/controller/pressB',
    crossdomain: 'true',
    headers: { 'Content-Type': 'application/json' }
  };
  return axios(config)
    .then(onGlobalSuccess)
    .catch(onGlobalError);
};

const pressA = () => {
  const config = {
    method: 'GET',
    url: url + '/api/controller/pressA',
    crossdomain: 'true',
    headers: { 'Content-Type': 'application/json' }
  };
  return axios(config)
    .then(onGlobalSuccess)
    .catch(onGlobalError);
};

const pressStart = () => {
  const config = {
    method: 'GET',
    url: url + '/api/controller/pressStart',
    crossdomain: 'true',
    headers: { 'Content-Type': 'application/json' }
  };
  return axios(config)
    .then(onGlobalSuccess)
    .catch(onGlobalError);
};

const pressSelect = () => {
  const config = {
    method: 'GET',
    url: url + '/api/controller/pressSelect',
    crossdomain: 'true',
    headers: { 'Content-Type': 'application/json' }
  };
  return axios(config)
    .then(onGlobalSuccess)
    .catch(onGlobalError);
};

module.exports = {
  pressRight,
  pressLeft,
  pressDown,
  pressUp,
  pressB,
  pressA,
  pressStart,
  pressSelect
};
