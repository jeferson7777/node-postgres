var helper = require(__dirname + '/test-helper');
test('emits notice message', function() {
  var client = helper.client();
  client.query('create temp table boom(id serial, size integer)');
  assert.emits(client, 'notice', function(notice) {
    assert.ok(notice != null);
    //TODO ending connection after notice generates weird errors
    process.nextTick(function() {
      client.end();
    })
  });
})

test('emits notify message', function() {
  var client = helper.client();
  client.query('LISTEN boom', assert.calls(function() {
    var otherClient = helper.client();
    otherClient.query('LISTEN boom', assert.calls(function() {
      client.query("NOTIFY boom, 'omg!'");
      assert.emits(client, 'notification', function(msg) {
        
        //make sure PQfreemem doesn't invalidate string pointers
        setTimeout(function() {
          assert.equal(msg.channel, 'boom');
          assert.ok(msg.payload == 'omg!' /*9.x*/ || msg.payload == '' /*8.x*/, "expected blank payload or correct payload but got " + msg.message)
          client.end()
        }, 500)

      });
      assert.emits(otherClient, 'notification', function(msg) {
        assert.equal(msg.channel, 'boom');
        otherClient.end();
      });
    }));
  }));
})
