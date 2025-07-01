def is_teacher_in_classroom(user, classroom):
    return classroom.teachers.filter(id=user.id).exists()


def is_student_in_classroom(user, classroom):
    return classroom.students.filter(id=user.id).exists()


def is_member_in_classroom(user, classroom):
    return is_teacher_in_classroom(user, classroom) or is_student_in_classroom(user, classroom)


def is_teacher(user, classroom):
    return classroom.teachers.filter(id=user.id).exists()


def is_student(user, classroom):
    return classroom.students.filter(id=user.id).exists()


def is_member(user, classroom):
    return is_teacher(user, classroom) or is_student(user, classroom)