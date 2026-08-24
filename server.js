
app.post('/api/log', express.text({type: '*/*'}), (req, res) => {
  console.log('CLIENT ERROR:', req.body);
  res.send('ok');
});
