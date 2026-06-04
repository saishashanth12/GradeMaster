const pool = require('../db');

exports.getEvents = async (req, res) => {
  const userId = req.user.id;
  try {
    const events = await pool.query(
      'SELECT id, title, company_name as company, event_date as date, event_type as type FROM recruitment_events WHERE user_id = $1 ORDER BY event_date ASC',
      [userId]
    );
    res.json(events.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving events' });
  }
};

exports.addEvent = async (req, res) => {
  const userId = req.user.id;
  const { title, company, type, date } = req.body;
  try {
    if (!['aptitude', 'placement'].includes(type)) {
       return res.status(400).json({ error: 'Invalid event type. Must be aptitude or placement.' });
    }
    const newEvent = await pool.query(
      'INSERT INTO recruitment_events (user_id, title, company_name, event_type, event_date) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, company_name as company, event_date as date, event_type as type',
      [userId, title, company || '', type, date]
    );
    res.status(201).json({ message: 'Event added', event: newEvent.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error adding event' });
  }
};

exports.updateEvent = async (req, res) => {
  const userId = req.user.id;
  const eventId = req.params.id;
  const { title, company, type, date } = req.body;
  try {
    if (!['aptitude', 'placement'].includes(type)) {
       return res.status(400).json({ error: 'Invalid event type.' });
    }
    const updated = await pool.query(
      'UPDATE recruitment_events SET title = $1, company_name = $2, event_type = $3, event_date = $4 WHERE id = $5 AND user_id = $6 RETURNING id, title, company_name as company, event_date as date, event_type as type',
      [title, company || '', type, date, eventId, userId]
    );
    res.json({ message: 'Event updated', event: updated.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating event' });
  }
};

exports.deleteEvent = async (req, res) => {
  const userId = req.user.id;
  const eventId = req.params.id;
  try {
    await pool.query('DELETE FROM recruitment_events WHERE id = $1 AND user_id = $2', [eventId, userId]);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting event' });
  }
};

exports.getPlacementHub = async (req, res) => {
  const userId = req.user.id;

  try {
    // Return organization cards. We will fetch jobs, and left join with user_job_matches to get selection probability
    const result = await pool.query(`
      SELECT j.id, j.company_name, j.role_title, j.description, j.keywords,
             COALESCE(um.proximity_score, 0) as selection_probability
      FROM job_listings j
      LEFT JOIN user_job_matches um ON j.id = um.job_id AND um.user_id = $1
      ORDER BY selection_probability DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error getting placement hub cards' });
  }
};
