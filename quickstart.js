const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// Escopo de envio de e-mail, caso mude o arquivo gerado credentials.json devera ser excluido
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = 'credentials.json';


// Gere as credenciais de acesso nesta url. - https://console.developers.google.com/apis/credentials
// Nota: escolha o tipo de projeto outros
fs.readFile('client_secret.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Autorizacao do cliente e depois envia o e-mail
  authorize(JSON.parse(content), sendMessage);
});

/**
 * Cria o OAuth2 client com sua credencial, e executa o callback passando a credencial
 * @param {Object} credentials Credencial de autorizacao.
 * @param {function} callback Call back de chamada.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Verifica se ja existe um token criado.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Recupera e armazena um novo token apos realizar o processo de autorizacao da API, e depois
 * executa o call back para o cliente oAuth2 autorizado
 * @param {google.auth.OAuth2} oAuth2Client O OAuth2 cliente para recuperar o token.
 * @param {getEventsCallback} callback Call back de chamada.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Voce deve autorizar este app pela url: ', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Cole o codigo de autorizacao aqui: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return callback(err);
      oAuth2Client.setCredentials(token);
      // Armazena o token para as execucoes posteriores
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token armazenado em ', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}


function makeBody(to, from, subject, message) {
  var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "to: ", to, "\n",
    "from: ", from, "\n",
    "subject: ", subject, "\n\n",
    message
  ].join('');

  var encodedMail = new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
  return encodedMail;
}

function sendMessage(auth) {
  var raw = makeBody('toxpto@gmail.com'
    , 'fromxpto@gmail.com'
    , 'nodejs oAuth2 envio de email pelo gmail'
    , 'mensagem loren ipsulon dollar its a met');

  const gmail = google.gmail({ version: 'v1', auth });

  gmail.users.messages.send({
    auth: auth,
    userId: 'fromxpto@gmail.com',
    resource: {
      raw: raw
    }
  }, function (err, response) {
    if (err) {
      console.log(err);
    } else {
      console.log(response);
    }
  });
}
