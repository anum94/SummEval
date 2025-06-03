from django.urls import path

from .views.atomic_facts_view import AtomicFactsView
from .views.auto_evaluation_view import AutoEvaluationView
from .views.celery_tasks_view import task_status, get_task_id_from_cache
from .views.correlation_view import CorrelationView
from .views.evaluation_view import EvaluationView
from .views.experiment_view import ExperimentOwnershipView
from .views.experiment_view import ExperimentSummaryView
from .views.experiment_view import ExperimentView
from .views.fulltext_view import FullTextView
from .views.invitation_view import InvitationView
from .views.project_invitation_view import ProjectInvitationView
from .views.project_view import ProjectView
from .views.survey_view import SurveyView, get_all_summaries

urlpatterns = [
    path('projects/', ProjectView.as_view(), name='projects'),
    path('experiments/get-by-id/', ExperimentView.get_by_experiment_id, name='experiments-by-id'),
    path('experiments/get-paginated-summaries/', ExperimentView.get_paginated_summaries, name='get_paginated_summaries'),
    path('experiments/', ExperimentView.as_view(), name='experiments'),
    path('fulltexts/', FullTextView.as_view(), name='fulltexts'),
    path("evaluation/", EvaluationView.as_view(), name="submit_evaluation"),
    path('survey/evaluations/', SurveyView.retrieve_performance_overview, name='evaluations'),
    path('survey/', SurveyView.as_view(), name='survey'),
    path('invitation/', InvitationView.as_view(), name='invitation'),
    path("evaluation/getCSV/", EvaluationView.get_csv, name="evaluation"),
    path("evaluation/", EvaluationView.as_view(), name="evaluation"),
    path("get-summaries-for-eval/", get_all_summaries, name="get-all-summaries-for-eval"),
    path("auto-evaluation/", AutoEvaluationView.as_view(), name="auto_evaluation"),
    path("calculate-correlations/", CorrelationView.as_view(), name="calculate_correlations"),
    path('experiments/summary/', ExperimentSummaryView.as_view(), name='experiments-summary'),
    path('project-invitations/', ProjectInvitationView.as_view(), name='project-invitations'),
    path('project-invitations/update-status/', ProjectInvitationView.as_view(), name='project-invitation-update-status'),
    path("get-atomic-facts-for-paragraph/", AtomicFactsView.as_view(), name="get_atomic_facts_for_paragraph"),
    path('experiments/ownership/', ExperimentOwnershipView.as_view(), name='experiment-ownership'),
    path('tasks/<str:task_id>/status', task_status, name='task-status'),
    path('tasks/from-cache/<str:cache_key>', get_task_id_from_cache, name='get_task_id_from_cache'),
]
