curl -X POST http://127.0.0.1:8000/register-languages \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imdlbml1c29nb25layJ9.gWtfRiOakW3cdYOvQpsxXrmwWqJl-l0IG9zRqZ5Sg4I" \
  -H "Content-Type: application/json" \
  -d '{"known_language":"en","target_language":"es"}'