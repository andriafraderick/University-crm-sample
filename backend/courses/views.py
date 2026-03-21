from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count
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


@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    from students.models import Student
    from courses.models import Enrollment, Course, Department
    from finance.models import FeeRecord
    from django.db.models import Sum

    # Student counts
    student_total     = Student.objects.count()
    student_active    = Student.objects.filter(status='active').count()
    student_graduated = Student.objects.filter(status='graduated').count()
    student_inactive  = Student.objects.filter(status='inactive').count()
    student_suspended = Student.objects.filter(status='suspended').count()

    # Enrollment counts
    enrollment_active    = Enrollment.objects.filter(status='enrolled').count()
    enrollment_courses   = Course.objects.count()

    # Fee summary
    fee_paid    = FeeRecord.objects.filter(status='paid').aggregate(t=Sum('amount'))['t'] or 0
    fee_pending = FeeRecord.objects.filter(status='pending').aggregate(t=Sum('amount'))['t'] or 0
    fee_overdue = FeeRecord.objects.filter(status='overdue').count()

    # Enrollments per department
    dept_enrollments = (
        Enrollment.objects
        .filter(status='enrolled')
        .values('course__department__name')
        .annotate(count=Count('id'))
        .order_by('-count')[:6]
    )

    # Recent students (last 5)
    from students.serializers import StudentSerializer
    recent = Student.objects.order_by('-created_at')[:5]
    recent_data = StudentSerializer(recent, many=True).data

    # Fee breakdown by status (amounts)
    fee_breakdown = (
        FeeRecord.objects
        .values('status')
        .annotate(total=Sum('amount'))
    )

    return Response({
        'students': {
            'total': student_total,
            'active': student_active,
            'graduated': student_graduated,
            'inactive': student_inactive,
            'suspended': student_suspended,
        },
        'enrollments': {
            'active': enrollment_active,
            'courses': enrollment_courses,
        },
        'fees': {
            'paid': float(fee_paid),
            'pending': float(fee_pending),
            'overdue_count': fee_overdue,
            'breakdown': [
                {'status': r['status'], 'total': float(r['total'] or 0)}
                for r in fee_breakdown
            ],
        },
        'dept_enrollments': [
            {'dept': r['course__department__name'] or 'Unassigned', 'count': r['count']}
            for r in dept_enrollments
        ],
        'recent_students': recent_data,
    })