
blurt.api.setOptions({ url: "https://rpc.blurt.buzz", useAppbaseApi: true })

// Generates Aall Private Keys from username and password
function getPrivateKeys(username, password, roles = ['owner', 'active', 'posting', 'memo']) {
  const privKeys = {};
  roles.forEach((role) => {
    privKeys[role] = dsteem.PrivateKey.fromLogin(username, password, role).toString();
    privKeys[`${role}Pubkey`] = dsteem.PrivateKey.from(privKeys[role]).createPublic().toString();
  });

  return privKeys;
};

// Creates a suggested password
function suggestPassword() {
  const array = new Uint32Array(10);
  window.crypto.getRandomValues(array);
  return 'P' + dsteem.PrivateKey.fromSeed(array).toString();
}

// Getting public owner key from username and password
function getPublicOwnerKey(username, password) {
  return (getPrivateKeys(username, password, ['owner'])).ownerPubkey;
}

// Checks if an account is eligible for recovery
async function checkEligibility(username) {
  const [account] = await client.database.getAccounts([username]);
  const now = new Date();
  const lastUpdate = new Date(`${account.last_owner_update}Z`);

  return ((now.getTime() - lastUpdate.getTime()) < (86400000 * 30));
}

$(document).ready(async function () {
  $('#change-recovery-account').submit(async function (e) {
    e.preventDefault();

    const feedback = $('#alert-change-rec');
    const username = $('#change-rec-atr').val();
    const newRecovery = $('#change-rec-new').val();
    const password = $('#change-rec-pass').val();

    feedback.empty().removeClass('alert-success').removeClass('alert-danger');

    if (username !== '' && newRecovery !== '' && password !== '') {
      const op = ['change_recovery_account', {
        account_to_recover: username,
        new_recovery_account: newRecovery,
        extensions: [],
      }];

      const ownerKey = getPrivateKeys(username, password, ['owner']);
      blurt.broadcast.send({ operations: [op], extensions: [] }, { owner: ownerKey.owner }, function (error, result) {
        if (!error && result) {
          feedback.addClass('alert-success').html(`Change account recovery request for <strong>${username}</strong> has been submitted successfully. It would take 30 days to take effect.`);

        } else {
          console.log(error);
          feedback.addClass('alert-danger').text(error.message);
        }
      });

    }
  });
});

