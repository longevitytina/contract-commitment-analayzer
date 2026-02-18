from app import create_app
from app.config import Settings

app = create_app()


if __name__ == "__main__":
    settings = Settings()
    app.run(debug=True, port=settings.flask_run_port)

