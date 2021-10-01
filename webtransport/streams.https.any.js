// META: global=window,worker
// META: script=/common/get-host-info.sub.js
// META: script=resources/webtransport-test-helpers.sub.js

promise_test(async t => {
  const WT_CODE = 240;
  const HTTP_CODE = webtransport_code_to_http_code(WT_CODE);
  const wt = new WebTransport(
    webtransport_url(`abort-stream-from-server.py?code=${HTTP_CODE}`));
  add_completion_callback(() => wt.close());
  await wt.ready;

  const writable = await wt.createUnidirectionalStream();
  const writer = writable.getWriter();

  // Write something, to make the stream visible to the server side.
  await writer.write(new Uint8Array([64]));

  // Sadly we cannot use promise_rejects_dom as the error constructor is
  // WebTransportError rather than DOMException. Ditto below.
  // We get a possible error, and then make sure wt.closed is rejected with it.
  const e = await writer.closed.catch(e => e);
  await promise_rejects_exactly(
      t, e, writer.closed, 'closed promise should be rejected');
  assert_true(e instanceof WebTransportError);
  assert_equals(e.source, 'stream', 'source');
  assert_equals(e.streamErrorCode, WT_CODE, 'streamErrorCode');
}, 'STOP_SENDING coming from server');

promise_test(async t => {
  const WT_CODE = 127;
  const HTTP_CODE = webtransport_code_to_http_code(WT_CODE);
  const wt = new WebTransport(
    webtransport_url(`abort-stream-from-server.py?code=${HTTP_CODE}`));
  add_completion_callback(() => wt.close());
  await wt.ready;

  const bidi = await wt.createBidirectionalStream();
  const writer = bidi.writable.getWriter();

  // Write something, to make the stream visible to the server side.
  await writer.write(new Uint8Array([64]));

  const reader = bidi.readable.getReader();
  const e = await reader.closed.catch(e => e);
  await promise_rejects_exactly(
      t, e, reader.closed, 'closed promise should be rejected');
  assert_true(e instanceof WebTransportError);
  assert_equals(e.source, 'stream', 'source');
  assert_equals(e.streamErrorCode, WT_CODE, 'streamErrorCode');
}, 'RESET_STREAM coming from server');