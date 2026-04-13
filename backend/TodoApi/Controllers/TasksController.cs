using Microsoft.AspNetCore.Mvc;
using TodoApi.Services;
using TodoApi.Models;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly TaskService _service;
    private static readonly string[] ValidStatus = { "Pending", "InProgress", "Completed" };
    private static readonly string[] ValidPriority = { "Low", "Medium", "High" };


    public TasksController(TaskService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? status, [FromQuery] string? priority)
    {
        var tasks = await _service.GetAll(status, priority);
        return Ok(tasks);
    }

    [HttpPost]
    public async Task<IActionResult> Create(TaskItem task)
    {

        if (!ValidStatus.Contains(task.Status))
            return BadRequest("Invalid status");

        if (!ValidPriority.Contains(task.Priority))
            return BadRequest("Invalid priority");


        var created = await _service.Create(task);
        return Ok(created);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _service.Delete(id);
        if (!success) return NotFound();

        return NoContent();
    }
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, TaskItem task)
    {
        if (id != task.Id)
            return BadRequest("ID mismatch");

        if (!ValidStatus.Contains(task.Status))
            return BadRequest("Invalid status");

        if (!ValidPriority.Contains(task.Priority))
            return BadRequest("Invalid priority");

        var updated = await _service.Update(id, task);
        if (updated == null) return NotFound();

        return Ok(updated);
    }

}