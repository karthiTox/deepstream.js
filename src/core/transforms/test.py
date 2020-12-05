import numpy;

a = numpy.array([1, 2, 3, 4, 5]).reshape([1, 5])
b = numpy.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).reshape([5, 2])

print(a@b)