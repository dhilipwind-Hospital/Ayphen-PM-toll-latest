import { Router } from 'express';
import axios from 'axios';

const router = Router();

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

const webhooks: Webhook[] = [];

// Create webhook
router.post('/webhooks', async (req, res) => {
  try {
    const { url, events, secret } = req.body;
    
    const webhook: Webhook = {
      id: Date.now().toString(),
      url,
      events,
      secret,
      active: true,
    };
    
    webhooks.push(webhook);
    res.json(webhook);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// List webhooks
router.get('/webhooks', async (req, res) => {
  res.json(webhooks);
});

// Delete webhook
router.delete('/webhooks/:id', async (req, res) => {
  const index = webhooks.findIndex(w => w.id === req.params.id);
  if (index > -1) {
    webhooks.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Webhook not found' });
  }
});

// Trigger webhook
export const triggerWebhook = async (event: string, data: any) => {
  const activeWebhooks = webhooks.filter(w => w.active && w.events.includes(event));
  
  for (const webhook of activeWebhooks) {
    try {
      await axios.post(webhook.url, {
        event,
        data,
        timestamp: new Date().toISOString(),
      }, {
        headers: {
          'X-Webhook-Secret': webhook.secret,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error(`Webhook failed: ${webhook.url}`, error);
    }
  }
};

// API Integration endpoints
router.post('/integrations/slack', async (req, res) => {
  try {
    const { webhookUrl, message } = req.body;
    await axios.post(webhookUrl, { text: message });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Slack integration failed' });
  }
});

router.post('/integrations/github', async (req, res) => {
  try {
    const { token, repo, issue } = req.body;
    await axios.post(
      `https://api.github.com/repos/${repo}/issues`,
      issue,
      { headers: { Authorization: `token ${token}` } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'GitHub integration failed' });
  }
});

router.post('/integrations/jira', async (req, res) => {
  try {
    const { url, email, apiToken, issue } = req.body;
    await axios.post(`${url}/rest/api/3/issue`, issue, {
      auth: { username: email, password: apiToken },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Jira integration failed' });
  }
});

export default router;
