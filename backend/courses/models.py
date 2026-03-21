from django.db import models
from students.models import Student

class Department(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return self.name

class Faculty(models.Model):
    DESIGNATION_CHOICES = [
        ('professor', 'Professor'),
        ('associate_professor', 'Associate Professor'),
        ('assistant_professor', 'Assistant Professor'),
        ('lecturer', 'Lecturer'),
    ]

    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='faculty')
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    designation = models.CharField(max_length=30, choices=DESIGNATION_CHOICES, default='lecturer')
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Faculty'

class Course(models.Model):
    SEMESTER_CHOICES = [
        ('fall', 'Fall'),
        ('spring', 'Spring'),
        ('summer', 'Summer'),
    ]

    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='courses')
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses')
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    credits = models.PositiveIntegerField(default=3)
    semester = models.CharField(max_length=10, choices=SEMESTER_CHOICES, default='fall')
    year = models.PositiveIntegerField(default=2025)

    def __str__(self):
        return f"{self.code} — {self.name}"

class Enrollment(models.Model):
    STATUS_CHOICES = [
        ('enrolled', 'Enrolled'),
        ('dropped', 'Dropped'),
        ('completed', 'Completed'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_on = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enrolled')

    def __str__(self):
        return f"{self.student.name} → {self.course.code}"

    class Meta:
        unique_together = ('student', 'course')  # prevent duplicate enrollments

class Grade(models.Model):
    GRADE_CHOICES = [
        ('A+', 'A+'), ('A', 'A'), ('A-', 'A-'),
        ('B+', 'B+'), ('B', 'B'), ('B-', 'B-'),
        ('C+', 'C+'), ('C', 'C'), ('F', 'F'),
    ]

    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name='grade')
    marks = models.FloatField()
    grade = models.CharField(max_length=3, choices=GRADE_CHOICES)

    def __str__(self):
        return f"{self.enrollment} — {self.grade}"

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
    ]

    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='present')

    def __str__(self):
        return f"{self.enrollment} — {self.date} — {self.status}"

    class Meta:
        unique_together = ('enrollment', 'date')