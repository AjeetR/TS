"use strict";
import express from 'express';
import swaggerUI from 'swagger-ui-express'
import YAML from 'yamljs'
const swaggerDoc = YAML.load('./src/swagger/swagger-doc.yaml')
const router = express();
router.use(swaggerUI.serve, swaggerUI.setup(swaggerDoc));

export default router