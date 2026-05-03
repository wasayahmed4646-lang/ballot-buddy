const http = require("http");
const fs = require("fs");
const path = require("path");
const { answerQuestion } = require("./src/assistantCore");
const resourcesHandler = require("./api/resources");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body is too large"));
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(root, pathname));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.url === "/api/assistant" && request.method === "POST") {
    try {
      const body = await readJson(request);
      const answer = await answerQuestion(body);
      sendJson(response, 200, answer);
    } catch (error) {
      sendJson(response, error.statusCode || 500, {
        error: error.statusCode ? error.message : "The assistant could not answer right now."
      });
    }
    return;
  }

  if (request.url === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
    return;
  }

  if (request.url.startsWith("/api/resources")) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const query = Object.fromEntries(url.searchParams.entries());
    await resourcesHandler(
      { method: request.method, query },
      {
        status(code) {
          response.statusCode = code;
          return this;
        },
        json(payload) {
          sendJson(response, response.statusCode || 200, payload);
        }
      }
    );
    return;
  }

  sendStatic(request, response);
});

server.listen(port, () => {
  console.log(`Ballot Buddy running at http://localhost:${port}`);
});
