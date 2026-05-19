import calendar
from datetime import date, datetime, timedelta
from typing import List, Dict, Set, Tuple

from app.schemas.schemas import (
    CollaboratorBase,
    ShiftBase,
    ScheduleRequest,
    ScheduleResult,
    ShiftAssignment,
)

# Maps Portuguese weekday names in shift names to weekday numbers (Monday=0)
WEEKDAY_MAP = {
    "segunda": 0,
    "terça": 1,
    "terca": 1,
    "quarta": 2,
    "quinta": 3,
    "sexta": 4,
    "sábado": 5,
    "sabado": 5,
    "domingo": 6,
}

# Shift durations per role (hours)
DURATIONS = {
    "graduado": 6,
    "estagiario": 5,
    "recepcao": 6,
    "servicos_gerais": 6,
}


def _add_hours(time_str: str, hours: int) -> str:
    dt = datetime.strptime(time_str, "%H:%M") + timedelta(hours=hours)
    return dt.strftime("%H:%M")


def _detect_weekday(shift_name: str) -> int | None:
    lower = shift_name.lower()
    for key, wd in WEEKDAY_MAP.items():
        if key in lower:
            return wd
    return None


def _dates_for_weekday(weekday: int, month: int, year: int) -> List[date]:
    """Return all dates in month/year that fall on the given weekday."""
    _, days_in_month = calendar.monthrange(year, month)
    return [
        date(year, month, d)
        for d in range(1, days_in_month + 1)
        if date(year, month, d).weekday() == weekday
    ]


class SchedulingService:
    def __init__(self, request: ScheduleRequest):
        self.collaborators = request.collaborators
        self.shifts = request.shifts
        self.month = request.month
        self.year = request.year
        self._validate_asterisk_rule()

    # ── Validation ───────────────────────────────────────────────────────────

    def _validate_asterisk_rule(self):
        roles_to_check = ["graduado", "estagiario", "recepcao"]
        for role in roles_to_check:
            group = [c for c in self.collaborators if c.role == role]
            blocked = [c for c in group if c.block_saturday_1]
            if len(blocked) > 2:
                raise ValueError(
                    f"Limite de restrições ultrapassado: máximo de 2 {role}s bloqueados no Sábado 1."
                )
            if group and len(blocked) == len(group):
                raise ValueError(
                    f"100% da equipe de {role}s está bloqueada para o Sábado 1."
                )

    # ── Core generation ──────────────────────────────────────────────────────

    def generate(self) -> ScheduleResult:
        use_real_dates = self.month is not None and self.year is not None

        assignments: List[ShiftAssignment] = []
        unfilled: List[dict] = []
        shift_counts: Dict[str, int] = {c.id: 0 for c in self.collaborators}

        # Track booked slots: collaborator_id → set of (date, start_time) tuples
        booked: Dict[str, Set[Tuple[str, str]]] = {c.id: set() for c in self.collaborators}

        role_groups = {
            "graduado": [c for c in self.collaborators if c.role == "graduado"],
            "estagiario": [c for c in self.collaborators if c.role == "estagiario"],
            "recepcao": [c for c in self.collaborators if c.role == "recepcao"],
            "servicos_gerais": [c for c in self.collaborators if c.role == "servicos_gerais"],
        }

        for shift in self.shifts:
            is_saturday_1 = "sábado" in shift.name.lower() and "turno 1" in shift.name.lower()

            if use_real_dates:
                weekday = _detect_weekday(shift.name)
                dates = _dates_for_weekday(weekday, self.month, self.year) if weekday is not None else [None]
            else:
                dates = [None]

            required_map = {
                "graduado": shift.required_graduados,
                "estagiario": shift.required_estagiarios,
                "recepcao": shift.required_recepcao,
                "servicos_gerais": shift.required_servicos_gerais,
            }

            for current_date in dates:
                date_label = current_date.isoformat() if current_date else shift.name

                for role, required_count in required_map.items():
                    if required_count == 0:
                        continue

                    candidates = [
                        c for c in role_groups[role]
                        if not (is_saturday_1 and c.block_saturday_1)
                        and (current_date is None or (date_label, shift.start_time) not in booked[c.id])
                    ]
                    candidates.sort(key=lambda x: shift_counts[x.id])

                    assigned = 0
                    for c in candidates:
                        if assigned >= required_count:
                            break
                        end_time = _add_hours(shift.start_time, DURATIONS.get(role, 6))
                        assignments.append(
                            ShiftAssignment(
                                shift_id=shift.id,
                                shift_name=shift.name,
                                collaborator_id=c.id,
                                collaborator_name=c.name,
                                date=date_label,
                                start_time=shift.start_time,
                                end_time=end_time,
                            )
                        )
                        booked[c.id].add((date_label, shift.start_time))
                        shift_counts[c.id] += 1
                        assigned += 1

                    if assigned < required_count:
                        unfilled.append(
                            {
                                "shift_id": shift.id,
                                "shift_name": shift.name,
                                "date": date_label,
                                "role": role,
                                "missing": required_count - assigned,
                            }
                        )

        return ScheduleResult(
            assignments=assignments,
            unfilled_shifts=unfilled,
            shift_counts=shift_counts,
            month=self.month,
            year=self.year,
        )
