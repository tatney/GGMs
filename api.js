const API = {
  async request(method, path, body, auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`/api${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  getToken() { return localStorage.getItem('ggm_token'); },
  setToken(token) { localStorage.setItem('ggm_token', token); },
  clearToken() { localStorage.removeItem('ggm_token'); },

  // Auth
  login(username, password) { return this.request('POST', '/auth/login', { username, password }, false); },
  getMe() { return this.request('GET', '/auth/me'); },
  changePassword(currentPassword, newPassword) { return this.request('POST', '/auth/change-password', { currentPassword, newPassword }); },

  // Submissions
  getSubmissions(type = 'all') { return this.request('GET', `/submissions?type=${type}`); },
  submitForm(data) { return this.request('POST', '/submissions', data, false); },
  markSubmissionRead(id) { return this.request('PATCH', `/submissions/${id}/read`, {}); },
  deleteSubmission(id) { return this.request('DELETE', `/submissions/${id}`); },

  // Events
  getEvents() { return this.request('GET', '/events', null, false); },
  createEvent(data) { return this.request('POST', '/events', data); },
  updateEvent(id, data) { return this.request('PUT', `/events/${id}`, data); },
  deleteEvent(id) { return this.request('DELETE', `/events/${id}`); },

  // News
  getNews(category = 'all') { return this.request('GET', `/news?category=${category}`, null, false); },
  getArticle(slug) { return this.request('GET', `/news/${slug}`, null, false); },
  createArticle(data) { return this.request('POST', '/news', data); },
  updateArticle(id, data) { return this.request('PUT', `/news/${id}`, data); },
  deleteArticle(id) { return this.request('DELETE', `/news/${id}`); },

  // Donations
  submitDonation(data) { return this.request('POST', '/donations', data, false); },
  getDonations() { return this.request('GET', '/donations'); },
  getDonationStats() { return this.request('GET', '/donations/stats'); },
};
