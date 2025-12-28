export function computeGrade(ca: number, exam: number) {
	const total = ca + exam;
	let grade = 'F';
	if (total >= 80) grade = 'A';
	else if (total >= 70) grade = 'B';
	else if (total >= 60) grade = 'C';
	else if (total >= 50) grade = 'D';
	else if (total >= 40) grade = 'E';
	return { total, grade };
}
