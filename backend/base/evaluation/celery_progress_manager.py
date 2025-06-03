from celery import Task


class CeleryProgressManager:
    def __init__(self, task: Task, phase_definitions):
        """
        :param task: Celery task instance
        :param phase_definitions: Dict of {
            'phase_id': {
                'name': 'Phase non-unique name',
                'message': 'Phase Message'
                'weight': 0.0-1.0,
                'steps': None|int
            }
        }
        """
        self.task: Task = task
        self.phases = phase_definitions
        self._validate_weights()
        self.completed_phases = set()
        self.active_phases = {}  # {phase_id: progress}
        self.phase_history = []
        self.total_progress = 0

    def _validate_weights(self):
        total_weight = sum(p['weight'] for p in self.phases.values())
        if not 0.99 < total_weight < 1.01:
            raise ValueError("Total phase weights must sum to 1.0")

    def enter_phase(self, phase_id, initial_progress=0):
        """Start or resume a phase"""
        if phase_id not in self.phases:
            raise ValueError(f"Unknown phase: {phase_id}")

        self.active_phases[phase_id] = initial_progress
        self.phase_history.append(phase_id)
        self._update_progress()

    def exit_phase(self, phase_id):
        """Mark phase as completed"""
        if phase_id not in self.active_phases:
            raise ValueError(f"Phase {phase_id} not active")

        self.completed_phases.add(phase_id)
        del self.active_phases[phase_id]
        self._update_progress()

    def handle_failure(self, exception):
        """Handle failure"""
        error_meta = {
            'error': str(exception),
            'exc_type': type(exception).__name__,
            'exc_message': exception.__str__(),
            'total_progress': self.total_progress,
            'active_phases': self.active_phases,
            'message': 'Something went wrong'
        }
        self.task.update_state(
            state='FAILURE',
            meta=error_meta
        )

    def update_phase(self, phase_id, current_step, total_steps=None):
        """Update progress within a phase"""
        if phase_id not in self.active_phases:
            raise ValueError(f"Phase {phase_id} not active")

        phase = self.phases[phase_id]
        if total_steps:
            phase['steps'] = total_steps

        if phase['steps']:
            progress = current_step / phase['steps']
        else:  # Indeterminate progress
            progress = min(self.active_phases[phase_id] + 0.05, 0.95)

        self.active_phases[phase_id] = progress
        self._update_progress()

    def _update_progress(self):
        """Calculate and send progress update"""
        # Calculate completed weight
        completed_weight = sum(
            self.phases[pid]['weight']
            for pid in self.completed_phases
        )

        # Calculate active weight contributions
        active_contributions = sum(
            self.phases[pid]['weight'] * progress
            for pid, progress in self.active_phases.items()
        )

        self.total_progress = (completed_weight + active_contributions) * 100

        # Prepare phase status
        active_phases = [{
            'id': pid,
            'name': self.phases[pid]['name'],
            'message': self.phases[pid]['message'],
            'progress': progress * 100
        } for pid, progress in self.active_phases.items()]

        # Update task state
        self.task.update_state(
            state='PROGRESS',
            meta={
                'total_progress': self.total_progress,
                'active_phases': active_phases,
                'completed_phases': list(self.completed_phases)
            }
        )
