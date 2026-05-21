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

    def generate_schedule(self) -> ScheduleResult:
        assignments = []
        unfilled = []
        shift_counts = {c.id: 0 for c in self.collaborators}
        weekend_counts = {c.id: 0 for c in self.collaborators}
        
        # Identificar primeiro e último turno de cada dia (agrupado por tudo antes do último hífen)
        daily_shifts = {}
        for s in self.shifts:
            group = s.id.rsplit('-', 1)[0]
            if group not in daily_shifts:
                daily_shifts[group] = []
            daily_shifts[group].append(s)
            
        first_shifts = set()
        last_shifts = set()
        for group, s_list in daily_shifts.items():
            s_list.sort(key=lambda x: x.start_time)
            if s_list:
                first_shifts.add(s_list[0].id)
                last_shifts.add(s_list[-1].id)

        for shift in self.shifts:
            is_weekend = 'Sábado' in shift.name or 'Domingo' in shift.name
            is_first = shift.id in first_shifts
            is_last = shift.id in last_shifts
            
            # 1. Assinar Graduados
            assigned_graduados = 0
            available_graduados = [c for c in self.collaborators if c.role == 'graduado' and not ('Sábado (Semana 1)' in shift.name and c.block_saturday_1)]
            
            # Ordenar graduados:
            # - Se for fim de semana, priorizar quem tem menos finais de semana (weekend_counts).
            # - Depois, priorizar quem tem menos turnos no total (shift_counts).
            # - Se for o primeiro turno do dia, forçar "abre" para o início da fila se possível.
            # - Se for o último turno do dia, forçar "fecha" para o início da fila se possível.
            
            def graduado_sort_key(c):
                # Penalty para forçar opener/closer
                penalty = 0
                if is_first and c.professor_mode == 'abre':
                    penalty = -1000
                elif is_last and c.professor_mode == 'fecha':
                    penalty = -1000
                elif c.professor_mode == 'abre' and not is_first:
                    penalty = 1000 # Evitar escalar opener em turnos que não abrem (se possível)
                elif c.professor_mode == 'fecha' and not is_last:
                    penalty = 1000 # Evitar escalar closer em turnos que não fecham (se possível)
                    
                w_count = weekend_counts[c.id] if is_weekend else 0
                return (w_count, penalty, shift_counts[c.id])
                
            available_graduados.sort(key=graduado_sort_key)
            
            for c in available_graduados:
                if assigned_graduados < shift.required_graduados:
                    assignments.append(ShiftAssignment(shift_id=shift.id, collaborator_id=c.id, date=shift.name, start_time=shift.start_time, end_time=calculate_end_time(shift.start_time, 6)))
                    shift_counts[c.id] += 1
                    if is_weekend:
                        weekend_counts[c.id] += 1
                    assigned_graduados += 1
                    
            if assigned_graduados < shift.required_graduados:
                unfilled.append({"shift_id": shift.id, "role": "graduado", "missing": shift.required_graduados - assigned_graduados})
                
            # 2. Assinar Estagiários
            assigned_estagiarios = 0
            available_estagiarios = [c for c in self.collaborators if c.role == 'estagiario' and not ('Sábado (Semana 1)' in shift.name and c.block_saturday_1)]
            
            def estagiario_sort_key(c):
                w_count = weekend_counts[c.id] if is_weekend else 0
                return (w_count, shift_counts[c.id])
                
            available_estagiarios.sort(key=estagiario_sort_key)
            
            for c in available_estagiarios:
                if assigned_estagiarios < shift.required_estagiarios:
                    st = shift.start_time
                    et = calculate_end_time(shift.start_time, 5) # Sempre 5 horas normais
                        
                    assignments.append(ShiftAssignment(shift_id=shift.id, collaborator_id=c.id, date=shift.name, start_time=st, end_time=et))
                    shift_counts[c.id] += 1
                    if is_weekend:
                        weekend_counts[c.id] += 1
                    assigned_estagiarios += 1
                    
            if assigned_estagiarios < shift.required_estagiarios:
                unfilled.append({"shift_id": shift.id, "role": "estagiario", "missing": shift.required_estagiarios - assigned_estagiarios})

            # 3. Assinar Recepção
            assigned_recepcao = 0
            available_recepcao = [c for c in self.collaborators if c.role == 'recepcao' and not ('Sábado (Semana 1)' in shift.name and c.block_saturday_1)]
            
            def recepcao_sort_key(c):
                w_count = weekend_counts[c.id] if is_weekend else 0
                return (w_count, shift_counts[c.id])
            available_recepcao.sort(key=recepcao_sort_key)
            
            for c in available_recepcao:
                if assigned_recepcao < shift.required_recepcao:
                    assignments.append(ShiftAssignment(shift_id=shift.id, collaborator_id=c.id, date=shift.name, start_time=shift.start_time, end_time=calculate_end_time(shift.start_time, 6)))
                    shift_counts[c.id] += 1
                    if is_weekend:
                        weekend_counts[c.id] += 1
                    assigned_recepcao += 1
                    
            if assigned_recepcao < shift.required_recepcao:
                unfilled.append({"shift_id": shift.id, "role": "recepcao", "missing": shift.required_recepcao - assigned_recepcao})

            # 4. Assinar Limpeza (Serviços Gerais)
            assigned_servicos = 0
            available_servicos = [c for c in self.collaborators if c.role == 'servicos_gerais' and not ('Sábado (Semana 1)' in shift.name and c.block_saturday_1)]
            
            def servicos_sort_key(c):
                w_count = weekend_counts[c.id] if is_weekend else 0
                return (w_count, shift_counts[c.id])
            available_servicos.sort(key=servicos_sort_key)
            
            for c in available_servicos:
                if assigned_servicos < shift.required_servicos_gerais:
                    assignments.append(ShiftAssignment(shift_id=shift.id, collaborator_id=c.id, date=shift.name, start_time=shift.start_time, end_time=calculate_end_time(shift.start_time, 6)))
                    shift_counts[c.id] += 1
                    if is_weekend:
                        weekend_counts[c.id] += 1
                    assigned_servicos += 1
                    
            if assigned_servicos < shift.required_servicos_gerais:
                unfilled.append({"shift_id": shift.id, "role": "servicos_gerais", "missing": shift.required_servicos_gerais - assigned_servicos})
                
        return ScheduleResult(assignments=assignments, unfilled_shifts=unfilled, shift_counts=shift_counts)
