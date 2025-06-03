from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class AutoEvaluation(models.Model):
    # Step 1: ContentType field to store the type of the referenced object
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True)
    # Step 2: IntegerField to store the primary key of the referenced object
    object_id = models.PositiveIntegerField(null=True)
    # Step 3: GenericForeignKey to tie the ContentType and primary key field together
    content_object = GenericForeignKey('content_type', 'object_id')

    bartscore = models.JSONField(default=dict)
    bertscore = models.JSONField(default=dict)
    bleu = models.JSONField(default=dict)
    meteor = models.JSONField(default=dict)
    rouge = models.JSONField(default=dict)
    token_shift_dist = models.JSONField(default=dict)
    unieval = models.JSONField(default=dict)
    llm_evaluation = models.JSONField(default=dict)
    factscore = models.JSONField(default=dict)
