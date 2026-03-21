from rest_framework import viewsets, filters
from .models import Department, Faculty, Course, Enrollment, Grade, Attendance
from .serializers import (
    DepartmentSerializer, FacultySerializer, CourseSerializer,
    EnrollmentSerializer, GradeSerializer, AttendanceSerializer,
)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email']

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related('department', 'faculty')
    serializer_class = CourseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name']
    ordering_fields = ['name', 'semester']

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related('student', 'course')
    serializer_class = EnrollmentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['student__name', 'course__code']

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.select_related('enrollment')
    serializer_class = GradeSerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('enrollment')
    serializer_class = AttendanceSerializer