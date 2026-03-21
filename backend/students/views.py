from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend 
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Student
from .serializers import StudentSerializer

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filterset_fields  = ['status'] 
    search_fields = ['name', 'email', 'student_id']
    ordering_fields = ['name', 'enrolled_date', 'status']

    # Extra endpoint: GET /api/students/stats/
    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.db.models import Count
        total     = Student.objects.count()
        active    = Student.objects.filter(status='active').count()
        graduated = Student.objects.filter(status='graduated').count()
        by_status = Student.objects.values('status').annotate(count=Count('id'))
        return Response({
            'total': total,
            'active': active,
            'graduated': graduated,
            'by_status': list(by_status),
        })