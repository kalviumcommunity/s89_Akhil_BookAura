/**
 * Express Router Utility
 * 
 * This utility provides a consistent way to create Express routers
 * without conflicts with the 'router' package.
 */

const express = require('express');

/**
 * Creates a new Express router
 * @returns {object} Express router instance
 */
function createRouter() {
  return express.Router();
}

module.exports = {
  createRouter
};
