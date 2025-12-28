(async () => {
  try {
    const url = 'https://hbkvvmnmrdjakbncaqrg.supabase.co/functions/v1/invite_user';
    const token = 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImpyYkI2RjdMMDFDTlZ4YVQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2hia3Z2bW5tcmRqYWtibmNhcXJnLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI4NTU4YzY0Yi01MGE2LTQ2OWMtOWY0ZC0zZGU5ZjlmMTM1MjUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzMTAyNzkzLCJpYXQiOjE3NjMwOTkxOTMsImVtYWlsIjoic3VwZXJibWVkaWE2M0BnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2MzA5OTE5M31dLCJzZXNzaW9uX2lkIjoiMDdkZmVmMzAtMjQxMS00NTE2LTk4M2MtNWYzZjIzMzM1ZmQ1IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.zPfkr-cWr7BaxU_x6LkzT0sHJOJXzPWEOs34wIlgs-A';

    const rand = Date.now();
    const body = {
      email: `test-invite+${rand}@example.com`,
      full_name: 'Node Invoke Test',
      role: 'teacher',
      school_id: '48928571-c46c-4fa8-a7b4-84521e63c9b3',
      temporary_password: 'TempPass123'
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    console.log('HTTP', res.status);
    console.log('BODY', text);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
