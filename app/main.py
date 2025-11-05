from fastapi import FastAPI
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles


app = FastAPI(title="Minimal Map")


# Serve /static (where index.html lives)
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# Redirect root (/) to the static index.html
@app.get("/", response_class=HTMLResponse)
def read_root():
    return RedirectResponse(url="/static/index.html")
