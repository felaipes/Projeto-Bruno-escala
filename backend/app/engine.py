from typing import List, Dict, Optional
from datetime import datetime, time, timedelta
from app.models import Collaborator, Shift, ScheduleRequest, ScheduleResult, ShiftAssignment

def calculate_end_time(start_time: time, duration_hours: int) -> time:
    dummy_date = datetime(2000, 1, 1, start_time.hour, start_time.minute)
    end_datetime = dummy_date + timedelta(hours=duration_hours)
    return end_datetime.time()

class SchedulingEngine:
    def __init__(self, request: ScheduleRequest):
        self.collaborators = request.collaborators
        self.shifts = request.shifts
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

    def generate_type_1_schedule(self) -> ScheduleResult:
        """
        Gera a escala para Tipo 1 (Professores: Graduados + Estagiários)
        """
        assignments = []
        unfilled = []
        
        # O Motor de Geração foca em distribuir com equilíbrio:
        # A diferença de plantões não pode ser maior que 1.
        shift_counts = {c.id: 0 for c in self.collaborators}
        
        for shift in self.shifts:
            # Assinar graduados
            assigned_graduados = 0
            available_graduados = [
                c for c in self.collaborators 
                if c.role == 'graduado' and not (shift.name == 'Sábado 1' and c.block_saturday_1)
            ]
            
            # Ordenar por quem tem menos plantões (Equilíbrio)
            available_graduados.sort(key=lambda x: shift_counts[x.id])
            
            for c in available_graduados:
                if assigned_graduados < shift.required_graduados:
                    assignments.append(ShiftAssignment(
                        shift_id=shift.id,
                        collaborator_id=c.id,
                        date=shift.name,
                        start_time=shift.start_time,
                        end_time=calculate_end_time(shift.start_time, 6) # Graduados = 6h
                    ))
                    shift_counts[c.id] += 1
                    assigned_graduados += 1
                    
            if assigned_graduados < shift.required_graduados:
                unfilled.append({"shift_id": shift.id, "role": "graduado", "missing": shift.required_graduados - assigned_graduados})
                
            # Assinar estagiários
            assigned_estagiarios = 0
            available_estagiarios = [
                c for c in self.collaborators 
                if c.role == 'estagiario' and not (shift.name == 'Sábado 1' and c.block_saturday_1)
            ]
            available_estagiarios.sort(key=lambda x: shift_counts[x.id])
            
            for c in available_estagiarios:
                if assigned_estagiarios < shift.required_estagiarios:
                    assignments.append(ShiftAssignment(
                        shift_id=shift.id,
                        collaborator_id=c.id,
                        date=shift.name,
                        start_time=shift.start_time,
                        end_time=calculate_end_time(shift.start_time, 5) # Estagiarios = 5h
                    ))
                    shift_counts[c.id] += 1
                    assigned_estagiarios += 1
                    
            if assigned_estagiarios < shift.required_estagiarios:
                unfilled.append({"shift_id": shift.id, "role": "estagiario", "missing": shift.required_estagiarios - assigned_estagiarios})
                
        return ScheduleResult(assignments=assignments, unfilled_shifts=unfilled, shift_counts=shift_counts)
