from typing import List, Dict
from app.models import Collaborator, ScheduleRequest, ScheduleResult, ShiftAssignment

class SchedulingEngine:
    def __init__(self, request: ScheduleRequest):
        self.collaborators = request.collaborators
        self.selected_days = request.selected_days
        self._validate_asterisk_rule()

    def _validate_asterisk_rule(self):
        blocked_graduados = sum(1 for c in self.collaborators if c.role == 'graduado' and c.block_saturday_1)
        blocked_estagiarios = sum(1 for c in self.collaborators if c.role == 'estagiario' and c.block_saturday_1)
        blocked_recepcao = sum(1 for c in self.collaborators if c.role == 'recepcao' and c.block_saturday_1)
        
        if blocked_graduados > 2:
            raise ValueError("Limite de restrições ultrapassado: máximo de 2 graduados bloqueados no Sábado 1.")
        if blocked_estagiarios > 2:
            raise ValueError("Limite de restrições ultrapassado: máximo de 2 estagiários bloqueados no Sábado 1.")
        if blocked_recepcao > 2:
            raise ValueError("Limite de restrições ultrapassado: máximo de 2 recepcionistas bloqueados no Sábado 1.")
            
        graduados = [c for c in self.collaborators if c.role == 'graduado']
        estagiarios = [c for c in self.collaborators if c.role == 'estagiario']
        
        if graduados and blocked_graduados == len(graduados):
             raise ValueError("100% da equipe de graduados está bloqueada para o Sábado 1.")
        if estagiarios and blocked_estagiarios == len(estagiarios):
             raise ValueError("100% da equipe de estagiários está bloqueada para o Sábado 1.")

    def generate_schedule(self) -> ScheduleResult:
        assignments = []
        unfilled = []
        shift_counts = {c.id: 0 for c in self.collaborators}
        weekend_counts = {c.id: 0 for c in self.collaborators}
        
        worked_weeks = {c.id: set() for c in self.collaborators}
        
        for day in self.selected_days:
            is_weekend = day in ['Sábado', 'Domingo']
            
            if is_weekend:
                # Gerar 4 semanas e distribuir 1 pessoa por semana (max 1 por mês)
                weeks = [1, 2, 3, 4]
                
                # Para cada cargo, tentamos distribuir uniformemente nas 4 semanas
                for role in ['graduado', 'estagiario', 'recepcao', 'servicos_gerais']:
                    for week in weeks:
                        date_str = f"{day} (Semana {week})"
                        
                        # Filtrar colaboradores disponíveis que não violam a regra de alternância
                        available = []
                        for c in self.collaborators:
                            if c.role != role:
                                continue
                            if day == 'Sábado' and week == 1 and c.block_saturday_1:
                                continue
                            
                            # Regra: não pode trabalhar na mesma semana, nem na anterior, nem na seguinte
                            if week in worked_weeks[c.id] or (week - 1) in worked_weeks[c.id] or (week + 1) in worked_weeks[c.id]:
                                continue
                                
                            available.append(c)
                            
                        if not available:
                            unfilled.append({
                                "shift_id": date_str,
                                "role": role,
                                "missing": 1
                            })
                            continue
                            
                        # Pegar a pessoa que tem menos finais de semana trabalhados
                        available.sort(key=lambda x: weekend_counts[x.id])
                        c = available[0]
                        
                        assignments.append(ShiftAssignment(
                            shift_id=f"{date_str}-{c.id}",
                            collaborator_id=c.id,
                            date=date_str,
                            start_time=c.start_time,
                            end_time=c.end_time
                        ))
                        shift_counts[c.id] += 1
                        weekend_counts[c.id] += 1
                        worked_weeks[c.id].add(week)
            else:
                # Dia útil: todos os colaboradores trabalham nos seus horários fixos
                for c in self.collaborators:
                    assignments.append(ShiftAssignment(
                        shift_id=f"{day}-{c.id}",
                        collaborator_id=c.id,
                        date=day,
                        start_time=c.start_time,
                        end_time=c.end_time
                    ))
                    shift_counts[c.id] += 1

        return ScheduleResult(assignments=assignments, unfilled_shifts=unfilled, shift_counts=shift_counts)
