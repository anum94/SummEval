from django.apps import AppConfig
from .evaluation.evaluation_handler import EvaluationHandler
from django.conf import settings


class BaseConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "base"

    def ready(self) -> None:
        settings.EVALUATION_HANDLER = EvaluationHandler()
