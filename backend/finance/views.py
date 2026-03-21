from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from .models import FeeRecord
from .serializers import FeeRecordSerializer

class FeeRecordViewSet(viewsets.ModelViewSet):
    queryset = FeeRecord.objects.select_related('student')
    serializer_class = FeeRecordSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['student__name', 'student__student_id']
    ordering_fields = ['due_date', 'amount', 'status']

    # Extra endpoint: GET /api/fees/summary/
    @action(detail=False, methods=['get'])
    def summary(self, request):
        total_due    = FeeRecord.objects.filter(status='pending').aggregate(t=Sum('amount'))['t'] or 0
        total_paid   = FeeRecord.objects.filter(status='paid').aggregate(t=Sum('amount'))['t'] or 0
        overdue      = FeeRecord.objects.filter(status='overdue').count()
        by_type      = FeeRecord.objects.values('fee_type').annotate(total=Sum('amount'))
        return Response({
            'total_due':   float(total_due),
            'total_paid':  float(total_paid),
            'overdue_count': overdue,
            'by_type':     list(by_type),
        })