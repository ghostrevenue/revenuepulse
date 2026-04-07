import express from 'express';
import * as cohortService from '../services/cohort.service.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const cohorts = cohortService.getAllCohortGroups(req.db, req.store.id);
    res.json({ cohorts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/report', (req, res) => {
  try {
    const report = cohortService.buildCohortReport(req.db, req.store.id);
    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const cohort = cohortService.getCohortGroup(req.db, req.store.id, req.params.id);
    if (!cohort) {
      return res.status(404).json({ error: 'Cohort not found' });
    }
    
    const analysis = cohortService.getCohortAnalysis(req.db, req.store.id, req.params.id);
    res.json({ ...cohort, analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, start_date, end_date } = req.body;
    if (!name || !start_date) {
      return res.status(400).json({ error: 'name and start_date are required' });
    }
    
    const id = cohortService.createCohortGroup(req.db, req.store.id, name, start_date, end_date || null);
    res.json({ id, message: 'Cohort group created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
