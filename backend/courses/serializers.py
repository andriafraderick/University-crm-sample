from rest_framework import serializers
from .models import Department, Faculty, Course, Enrollment, Grade, Attendance

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class FacultySerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Faculty
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    faculty_name    = serializers.CharField(source='faculty.name',     read_only=True)

    class Meta:
        model = Course
        fields = '__all__'

class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    course_name  = serializers.CharField(source='course.name',  read_only=True)
    course_code  = serializers.CharField(source='course.code',  read_only=True)

    class Meta:
        model = Enrollment
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source='enrollment.student.name', read_only=True
    )
    course_name = serializers.CharField(
        source='enrollment.course.name', read_only=True
    )
    course_code = serializers.CharField(
        source='enrollment.course.code', read_only=True
    )

    class Meta:
        model = Attendance
        fields = '__all__'


class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source='enrollment.student.name', read_only=True
    )
    course_name = serializers.CharField(
        source='enrollment.course.name', read_only=True
    )
    course_code = serializers.CharField(
        source='enrollment.course.code', read_only=True
    )

    class Meta:
        model = Grade
        fields = '__all__'