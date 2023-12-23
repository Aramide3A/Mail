document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id){
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#single-email-view').style.display = 'block';

    document.querySelector('#single-email-view').innerHTML= `
    <div class="card" >
    <div class="card-body">
      <h5 class="card-title">From: ${email.sender}</h5>
      <h6 class="card-subtitle mb-2 text-body-secondary">To: ${email.recipients}</h6>
      <h6 class="card-subtitle mb-2 text-body-secondary">Subject: ${email.subject}</h6>
      <h6 class="card-subtitle mb-2 text-body-secondary">Timestamp: ${email.timestamp}</h6>
      <p class="card-text">${email.body}</p>
    </div>
    </div>
    `
    if (email.read === false) {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
      
    }

    const archive_btn = document.createElement('button');
      archive_btn.innerHTML = email.archived ? 'Unarchive': 'Archive',
      archive_btn.className = email.archived ? 'btn btn-success': 'btn btn-danger',
      archive_btn.addEventListener('click', function() { 
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
          archived: !email.archived
          })
        })
        .then(() => {
          load_mailbox('inbox');
        })
      });
    document.querySelector('#single-email-view').append(archive_btn);

    const reply_btn = document.createElement('button');
      reply_btn.innerHTML = 'Reply',
      reply_btn.className = 'btn btn-primary',
      reply_btn.addEventListener('click', function() { 
        compose_email();

        document.querySelector('#compose-recipients').value = email.sender;
        function addReplyPrefix(subject) {
          return subject.startsWith('Re: ') ? subject : `Re: ${email.subject}`;
        }
        document.querySelector('#compose-subject').value = addReplyPrefix(email.subject);
        document.querySelector('#compose-body').value = `'On ${email.timestamp} ${email.body} wrote : ${email.body}'`;
      });
    document.querySelector('#single-email-view').append(reply_btn);

  });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      emails.forEach(NewEmail => {
        const element = document.createElement('div');
        if (NewEmail.read === true){
          element.innerHTML = `
          <div class="card text-bg-secondary mb-3" >
            <div class="card-body">
              <h5 class="card-title">${NewEmail.sender}</h5>
              <h6 class="card-subtitle mb-2 text-body-secondary">${NewEmail.timestamp}</h6>
              <p class="card-text">${NewEmail.subject}.</p>
            </div>
          `;
        }
        else{
          element.innerHTML = `
          <div class="card" >
            <div class="card-body">
              <h5 class="card-title">${NewEmail.sender}</h5>
              <h6 class="card-subtitle mb-2 text-body-secondary">${NewEmail.timestamp}</h6>
              <p class="card-text">${NewEmail.subject}.</p>
            </div>
          `;
        }
        element.addEventListener('click', function() { view_email(NewEmail.id)
        });
      document.querySelector('#emails-view').append(element);
      });
  });
}


function send_email(event) {
  event.preventDefault();
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    load_mailbox('sent')
  });
}